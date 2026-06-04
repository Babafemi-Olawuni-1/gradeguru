<?php
// Paystack/Flutterwave webhook + manual verify
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

$method = $_SERVER['REQUEST_METHOD'];

// Webhook from Paystack (no auth)
if ($method === 'POST' && isset($_GET['webhook'])) {
    $payload = json_decode(file_get_contents('php://input'), true);
    if (!$payload || $payload['event'] !== 'charge.success') exit;

    $ref    = $payload['data']['reference'] ?? '';
    $amount = (float)($payload['data']['amount'] ?? 0) / 100; // kobo to naira
    $meta   = $payload['data']['metadata'] ?? [];
    $schoolId = $meta['school_id'] ?? null;

    if (!$schoolId || !$amount || !$ref) exit;

    // Idempotency check
    if (fetchOne('SELECT id FROM transactions WHERE reference = ?', [$ref])) exit;

    $school = fetchOne('SELECT * FROM schools WHERE id = ?', [$schoolId]);
    if (!$school) exit;

    $newBalance = $school['wallet_balance'] + $amount;
    query('UPDATE schools SET wallet_balance = ? WHERE id = ?', [$newBalance, $schoolId]);
    insert('INSERT INTO transactions (school_id, type, amount, balance_before, balance_after, reference, gateway, description, status) VALUES (?,?,?,?,?,?,?,?,?)',
        [$schoolId, 'topup', $amount, $school['wallet_balance'], $newBalance, $ref, 'paystack', "Wallet top-up via Paystack", 'success']);
    exit;
}

// Manual verify (school admin polls after payment)
if ($method === 'GET') {
    $user   = getAuthUser(['school_admin']);
    $school = requireSchool($user);
    $ref    = $_GET['reference'] ?? '';
    if (!$ref) error('Reference required');

    // In production: call Paystack verify API here
    // Mock: just return current balance
    success(['balance' => (float)$school['wallet_balance']], 'Balance refreshed');
}

error('Method not allowed', 405);
