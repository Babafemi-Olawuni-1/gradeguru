<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config.php';

$user   = getAuthUser(['school_admin']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];

// ── GET balance + transactions ──────────────────────────────
if ($method === 'GET') {
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 20;
    $offset  = ($page - 1) * $perPage;

    $total = fetchOne('SELECT COUNT(*) as c FROM transactions WHERE school_id = ?', [$school['id']])['c'];
    $txns  = fetchAll(
        'SELECT * FROM transactions WHERE school_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [$school['id'], $perPage, $offset]
    );

    success([
        'balance'      => (float)$school['wallet_balance'],
        'transactions' => paginate($txns, $total, $page, $perPage),
    ]);
}

// ── POST initiate top-up via Paystack ──────────────────────
if ($method === 'POST') {
    $data   = body();
    $errors = validate($data, ['amount' => 'required|numeric']);
    if ($errors) error('Validation failed', 422, $errors);

    $amount = (float)$data['amount'];
    if ($amount < 500) error('Minimum top-up amount is ₦500');

    $secretKey = PAYSTACK_SECRET_KEY;
    if (empty($secretKey) || str_contains($secretKey, 'your_secret_key')) {
        error('Payment gateway not configured. Please contact the platform administrator.', 503);
    }

    // Generate a unique internal reference
    $reference = 'GG-' . strtoupper(bin2hex(random_bytes(8)));

    // Initialize Paystack transaction
    $paystackPayload = json_encode([
        'email'     => $user['email'],
        'amount'    => (int)($amount * 100), // naira to kobo
        'reference' => $reference,
        'callback_url' => ALLOWED_ORIGIN . '/admin/wallet?verify=' . $reference,
        'metadata'  => [
            'school_id'   => $school['id'],
            'school_name' => $school['name'],
            'custom_fields' => [
                ['display_name' => 'School', 'variable_name' => 'school_name', 'value' => $school['name']],
            ],
        ],
    ]);

    $ch = curl_init('https://api.paystack.co/transaction/initialize');
    curl_setopt($ch, CURLOPT_POST,           true);
    curl_setopt($ch, CURLOPT_POSTFIELDS,     $paystackPayload);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $secretKey,
        'Content-Type: application/json',
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response   = curl_exec($ch);
    $curlError  = curl_error($ch);
    $httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    if ($curlError) {
        error_log("Paystack curl error: $curlError");
        error('Could not connect to payment gateway. Please try again.', 502);
    }

    $psData = json_decode($response, true);

    if (!$psData || !$psData['status']) {
        error_log("Paystack init failed: $response");
        error($psData['message'] ?? 'Payment initialization failed. Please try again.', 502);
    }

    // Log a pending transaction for tracking
    insert(
        'INSERT INTO transactions (school_id, type, amount, balance_before, balance_after, reference, gateway, description, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
            $school['id'], 'topup', $amount,
            $school['wallet_balance'], $school['wallet_balance'],
            $reference, 'paystack',
            "Wallet top-up ₦" . number_format($amount, 2),
            'pending',
        ]
    );

    success([
        'reference'   => $reference,
        'amount'      => $amount,
        'payment_url' => $psData['data']['authorization_url'],
        'access_code' => $psData['data']['access_code'],
    ], 'Payment initiated');
}

error('Method not allowed', 405);
