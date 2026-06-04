<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config.php';

$user   = getAuthUser(['school_admin']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];

// ── GET list ────────────────────────────────────────────────
if ($method === 'GET') {
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(200, (int)($_GET['per_page'] ?? 50));
    $offset  = ($page - 1) * $perPage;
    $status  = $_GET['status'] ?? null;

    $where  = 'p.school_id = ?';
    $params = [$school['id']];
    if ($status) { $where .= ' AND p.status = ?'; $params[] = $status; }

    // Auto-expire
    query("UPDATE pins SET status='expired' WHERE school_id = ? AND status='unused' AND expires_at < NOW()", [$school['id']]);

    $total = fetchOne("SELECT COUNT(*) as c FROM pins p WHERE $where", $params)['c'];
    $pins  = fetchAll("SELECT p.*, s.first_name, s.last_name, s.admission_number, c.name as class_name
                       FROM pins p
                       LEFT JOIN students s ON s.id = p.student_id
                       LEFT JOIN classes c  ON c.id = p.class_id
                       WHERE $where ORDER BY p.created_at DESC LIMIT $perPage OFFSET $offset", $params);

    success(paginate($pins, $total, $page, $perPage));
}

// ── POST generate ───────────────────────────────────────────
if ($method === 'POST') {
    $data   = body();
    $errors = validate($data, ['quantity' => 'required|numeric', 'term_id' => 'required|numeric']);
    if ($errors) error('Validation failed', 422, $errors);

    $qty    = max(1, min(5000, (int)$data['quantity']));
    $termId = (int)$data['term_id'];
    $classId = $data['class_id'] ? (int)$data['class_id'] : null;

    // Verify term belongs to school
    $term = fetchOne('SELECT t.* FROM terms t JOIN academic_sessions s ON s.id = t.session_id WHERE t.id = ? AND t.school_id = ?', [$termId, $school['id']]);
    if (!$term) error('Term not found', 404);

    // PIN price from settings
    $priceKey = 'pin_price_' . $school['plan'];
    $priceRow = fetchOne("SELECT setting_value FROM platform_settings WHERE setting_key = ?", [$priceKey]);
    $unitPrice = (float)($priceRow['setting_value'] ?? 100);

    // Bulk discount
    $discount = 0;
    if ($qty >= 1000) $discount = 0.15;
    elseif ($qty >= 500) $discount = 0.10;
    elseif ($qty >= 100) $discount = 0.05;

    $unitCost  = $unitPrice * (1 - $discount);
    $totalCost = $unitCost * $qty;

    if ($school['wallet_balance'] < $totalCost) {
        error("Insufficient wallet balance. Required: ₦" . number_format($totalCost, 2) . ", Available: ₦" . number_format($school['wallet_balance'], 2), 402);
    }

    // PIN expiry
    $expiryDays = (int)(fetchOne("SELECT setting_value FROM platform_settings WHERE setting_key = 'pin_expiry_days'")['setting_value'] ?? 365);
    $expiresAt  = date('Y-m-d H:i:s', strtotime("+{$expiryDays} days"));

    db()->beginTransaction();
    try {
        $generated = [];
        for ($i = 0; $i < $qty; $i++) {
            $code = 'GG-' . strtoupper(bin2hex(random_bytes(3))) . '-' . strtoupper(bin2hex(random_bytes(3)));
            insert('INSERT INTO pins (school_id, class_id, term_id, pin_code, cost, expires_at) VALUES (?, ?, ?, ?, ?, ?)',
                [$school['id'], $classId, $termId, $code, $unitCost, $expiresAt]);
            $generated[] = $code;
        }

        // Deduct wallet
        $newBalance = $school['wallet_balance'] - $totalCost;
        query('UPDATE schools SET wallet_balance = ? WHERE id = ?', [$newBalance, $school['id']]);

        // Log transaction
        insert('INSERT INTO transactions (school_id, type, amount, balance_before, balance_after, description) VALUES (?, ?, ?, ?, ?, ?)',
            [$school['id'], 'pin_purchase', -$totalCost, $school['wallet_balance'], $newBalance,
             "Generated $qty PINs" . ($discount > 0 ? " (" . ($discount * 100) . "% bulk discount)" : "")]);

        db()->commit();
    } catch (Exception $e) {
        db()->rollBack();
        error('PIN generation failed. Please try again.', 500);
    }

    success([
        'quantity'    => $qty,
        'unit_cost'   => $unitCost,
        'total_cost'  => $totalCost,
        'discount'    => $discount * 100 . '%',
        'new_balance' => $newBalance,
        'pins'        => $generated,
    ], "$qty PINs generated successfully", 201);
}

error('Method not allowed', 405);
