<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user   = getAuthUser(['school_admin']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];

// ── GET balance + transactions ──────────────────────────────
if ($method === 'GET') {
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 20;
    $offset  = ($page - 1) * $perPage;

    $total = fetchOne('SELECT COUNT(*) as c FROM transactions WHERE school_id = ?', [$school['id']])['c'];
    $txns  = fetchAll('SELECT * FROM transactions WHERE school_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [$school['id'], $perPage, $offset]);

    success([
        'balance'      => (float)$school['wallet_balance'],
        'transactions' => paginate($txns, $total, $page, $perPage),
    ]);
}

// ── POST initiate top-up ────────────────────────────────────
if ($method === 'POST') {
    $data   = body();
    $errors = validate($data, ['amount' => 'required|numeric']);
    if ($errors) error('Validation failed', 422, $errors);

    $amount = (float)$data['amount'];
    if ($amount < 500) error('Minimum top-up amount is ₦500');

    // In production: initialize Paystack/Flutterwave here and return payment URL
    // For now return a mock reference
    $reference = 'GG-' . strtoupper(bin2hex(random_bytes(8)));

    success([
        'reference'   => $reference,
        'amount'      => $amount,
        'payment_url' => "https://checkout.paystack.com/{$reference}",
        'note'        => 'Redirect user to payment_url to complete payment',
    ], 'Payment initiated');
}

error('Method not allowed', 405);
