<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user   = getAuthUser(['super_admin']);
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? 'dashboard';

// ── Dashboard stats ─────────────────────────────────────────
if ($method === 'GET' && $action === 'dashboard') {
    $stats = [
        'total_schools'   => fetchOne('SELECT COUNT(*) as c FROM schools')['c'],
        'active_schools'  => fetchOne("SELECT COUNT(*) as c FROM schools WHERE status='active'")['c'],
        'pending_schools' => fetchOne("SELECT COUNT(*) as c FROM schools WHERE status='pending'")['c'],
        'total_pins_sold' => fetchOne("SELECT COUNT(*) as c FROM pins WHERE status='used'")['c'],
        'total_revenue'   => fetchOne("SELECT COALESCE(SUM(amount),0) as s FROM transactions WHERE type='topup' AND status='success'")['s'],
        'pro_schools'     => fetchOne("SELECT COUNT(*) as c FROM schools WHERE plan='pro'")['c'],
        'enterprise_schools' => fetchOne("SELECT COUNT(*) as c FROM schools WHERE plan='enterprise'")['c'],
    ];
    success($stats);
}

// ── List schools ────────────────────────────────────────────
if ($method === 'GET' && $action === 'schools') {
    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = 20;
    $offset  = ($page - 1) * $perPage;
    $search  = '%' . ($_GET['search'] ?? '') . '%';
    $status  = $_GET['status'] ?? null;

    $where  = '(name LIKE ? OR slug LIKE ? OR email LIKE ?)';
    $params = [$search, $search, $search];
    if ($status) { $where .= ' AND status = ?'; $params[] = $status; }

    $total   = fetchOne("SELECT COUNT(*) as c FROM schools WHERE $where", $params)['c'];
    $schools = fetchAll("SELECT s.*, (SELECT COUNT(*) FROM students WHERE school_id=s.id) as student_count,
                         (SELECT COUNT(*) FROM pins WHERE school_id=s.id AND status='used') as pins_used
                         FROM schools s WHERE $where ORDER BY s.created_at DESC LIMIT $perPage OFFSET $offset", $params);
    success(paginate($schools, $total, $page, $perPage));
}

// ── Update school status ────────────────────────────────────
if ($method === 'PUT' && $action === 'school_status') {
    $data = body();
    if (empty($data['school_id']) || empty($data['status'])) error('school_id and status required');
    if (!in_array($data['status'], ['active','suspended','pending'])) error('Invalid status');
    query('UPDATE schools SET status=? WHERE id=?', [$data['status'], $data['school_id']]);
    success(null, 'School status updated');
}

// ── Update platform settings ────────────────────────────────
if ($method === 'PUT' && $action === 'settings') {
    $data = body();
    foreach ($data as $key => $value) {
        if (fetchOne('SELECT id FROM platform_settings WHERE setting_key=?', [$key])) {
            query('UPDATE platform_settings SET setting_value=? WHERE setting_key=?', [$value, $key]);
        }
    }
    success(null, 'Settings updated');
}

// ── Wallet adjustment ───────────────────────────────────────
if ($method === 'POST' && $action === 'wallet_adjust') {
    $data   = body();
    $errors = validate($data, ['school_id'=>'required|numeric','amount'=>'required|numeric','reason'=>'required']);
    if ($errors) error('Validation failed', 422, $errors);

    $school = fetchOne('SELECT * FROM schools WHERE id=?', [$data['school_id']]);
    if (!$school) error('School not found', 404);

    $amount     = (float)$data['amount'];
    $newBalance = $school['wallet_balance'] + $amount;
    if ($newBalance < 0) error('Adjustment would result in negative balance');

    query('UPDATE schools SET wallet_balance=? WHERE id=?', [$newBalance, $school['id']]);
    insert('INSERT INTO transactions (school_id,type,amount,balance_before,balance_after,description) VALUES (?,?,?,?,?,?)',
        [$school['id'], 'adjustment', $amount, $school['wallet_balance'], $newBalance, $data['reason']]);

    success(['new_balance' => $newBalance], 'Wallet adjusted');
}

// ── Revenue report ──────────────────────────────────────────
if ($method === 'GET' && $action === 'revenue') {
    $rows = fetchAll(
        "SELECT s.name, s.slug, s.plan,
                COALESCE(SUM(CASE WHEN t.type='topup' THEN t.amount ELSE 0 END),0) as total_topup,
                COALESCE(SUM(CASE WHEN t.type='pin_purchase' THEN ABS(t.amount) ELSE 0 END),0) as pin_spend,
                COUNT(CASE WHEN p.status='used' THEN 1 END) as pins_used
         FROM schools s
         LEFT JOIN transactions t ON t.school_id = s.id AND t.status='success'
         LEFT JOIN pins p ON p.school_id = s.id
         GROUP BY s.id ORDER BY total_topup DESC"
    );
    success($rows);
}

error('Method not allowed', 405);
