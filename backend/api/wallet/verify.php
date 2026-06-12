<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config.php';

$method = $_SERVER['REQUEST_METHOD'];

// ── Paystack Webhook (no auth, called by Paystack servers) ──
if ($method === 'POST' && isset($_GET['webhook'])) {
    // Verify Paystack signature
    $secretKey = PAYSTACK_SECRET_KEY;
    $payload   = file_get_contents('php://input');
    $signature = $_SERVER['HTTP_X_PAYSTACK_SIGNATURE'] ?? '';

    if ($secretKey && $signature) {
        $expectedSig = hash_hmac('sha512', $payload, $secretKey);
        if (!hash_equals($expectedSig, $signature)) {
            http_response_code(400);
            exit('Invalid signature');
        }
    }

    $event = json_decode($payload, true);
    if (!$event || $event['event'] !== 'charge.success') {
        http_response_code(200); // Acknowledge but don't process
        exit;
    }

    $ref      = $event['data']['reference']                ?? '';
    $amount   = (float)($event['data']['amount']           ?? 0) / 100; // kobo → naira
    $meta     = $event['data']['metadata']                 ?? [];
    $schoolId = $meta['school_id']                         ?? null;
    $email    = $event['data']['customer']['email']        ?? '';

    if (!$ref || !$amount) { http_response_code(200); exit; }

    // Idempotency — don't process same reference twice
    $existing = fetchOne("SELECT id FROM transactions WHERE reference = ? AND status = 'success'", [$ref]);
    if ($existing) { http_response_code(200); exit; }

    // Find school by school_id from metadata, or fall back to user email
    $school = null;
    if ($schoolId) {
        $school = fetchOne('SELECT * FROM schools WHERE id = ?', [$schoolId]);
    }
    if (!$school && $email) {
        $userRow = fetchOne('SELECT school_id FROM users WHERE email = ?', [$email]);
        if ($userRow) $school = fetchOne('SELECT * FROM schools WHERE id = ?', [$userRow['school_id']]);
    }
    if (!$school) { http_response_code(200); exit; }

    $newBalance = $school['wallet_balance'] + $amount;
    query('UPDATE schools SET wallet_balance = ? WHERE id = ?', [$newBalance, $school['id']]);

    // Update or insert transaction
    $txn = fetchOne("SELECT id FROM transactions WHERE reference = ?", [$ref]);
    if ($txn) {
        query(
            "UPDATE transactions SET amount=?, balance_before=?, balance_after=?, status='success', description=? WHERE id=?",
            [$amount, $school['wallet_balance'], $newBalance, "Wallet top-up via Paystack ₦" . number_format($amount, 2), $txn['id']]
        );
    } else {
        insert(
            'INSERT INTO transactions (school_id, type, amount, balance_before, balance_after, reference, gateway, description, status)
             VALUES (?,?,?,?,?,?,?,?,?)',
            [$school['id'], 'topup', $amount, $school['wallet_balance'], $newBalance, $ref, 'paystack',
             "Wallet top-up via Paystack ₦" . number_format($amount, 2), 'success']
        );
    }

    http_response_code(200);
    exit('OK');
}

// ── Manual verify after redirect from Paystack ──────────────
if ($method === 'GET') {
    $user   = getAuthUser(['school_admin']);
    $school = requireSchool($user);
    $ref    = $_GET['reference'] ?? '';

    if (!$ref) error('Reference required');

    $secretKey = PAYSTACK_SECRET_KEY;
    if (empty($secretKey) || str_contains($secretKey, 'your_secret_key')) {
        // Gateway not configured — just return current balance
        success(['balance' => (float)$school['wallet_balance']], 'Balance refreshed');
        return;
    }

    // Check if already processed
    $txn = fetchOne("SELECT * FROM transactions WHERE reference = ? AND school_id = ?", [$ref, $school['id']]);
    if ($txn && $txn['status'] === 'success') {
        // Already credited — return fresh balance
        $freshSchool = fetchOne('SELECT wallet_balance FROM schools WHERE id = ?', [$school['id']]);
        success(['balance' => (float)$freshSchool['wallet_balance'], 'already_processed' => true], 'Payment already applied');
        return;
    }

    // Call Paystack to verify
    $ch = curl_init("https://api.paystack.co/transaction/verify/" . urlencode($ref));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Authorization: Bearer ' . $secretKey,
    ]);
    curl_setopt($ch, CURLOPT_TIMEOUT, 30);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, true);

    $response  = curl_exec($ch);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) error('Could not verify payment with gateway. Please try again.', 502);

    $psData = json_decode($response, true);

    if (!$psData || !$psData['status']) {
        error($psData['message'] ?? 'Payment verification failed.', 502);
    }

    if ($psData['data']['status'] !== 'success') {
        error('Payment was not successful. Status: ' . $psData['data']['status'], 400);
    }

    $amount   = (float)$psData['data']['amount'] / 100; // kobo → naira
    $schoolId = $school['id'];

    // Idempotency check
    $alreadyDone = fetchOne("SELECT id FROM transactions WHERE reference = ? AND status = 'success'", [$ref]);
    if ($alreadyDone) {
        $freshSchool = fetchOne('SELECT wallet_balance FROM schools WHERE id = ?', [$schoolId]);
        success(['balance' => (float)$freshSchool['wallet_balance']], 'Payment already applied');
        return;
    }

    $newBalance = $school['wallet_balance'] + $amount;
    query('UPDATE schools SET wallet_balance = ? WHERE id = ?', [$newBalance, $schoolId]);

    // Update pending transaction or insert new one
    if ($txn) {
        query(
            "UPDATE transactions SET amount=?, balance_before=?, balance_after=?, status='success', description=? WHERE id=?",
            [$amount, $school['wallet_balance'], $newBalance, "Wallet top-up via Paystack ₦" . number_format($amount, 2), $txn['id']]
        );
    } else {
        insert(
            'INSERT INTO transactions (school_id, type, amount, balance_before, balance_after, reference, gateway, description, status)
             VALUES (?,?,?,?,?,?,?,?,?)',
            [$schoolId, 'topup', $amount, $school['wallet_balance'], $newBalance, $ref, 'paystack',
             "Wallet top-up via Paystack ₦" . number_format($amount, 2), 'success']
        );
    }

    success(['balance' => (float)$newBalance, 'amount_credited' => $amount], 'Payment verified and wallet credited');
}

error('Method not allowed', 405);
