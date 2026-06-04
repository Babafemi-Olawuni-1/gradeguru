<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user   = getAuthUser(['school_admin']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];

// ── GET school profile ──────────────────────────────────────
if ($method === 'GET') {
    $limits = PLAN_LIMITS[$school['plan']];
    $studentCount = fetchOne('SELECT COUNT(*) as c FROM students WHERE school_id=? AND is_active=1', [$school['id']])['c'];
    $teacherCount = fetchOne("SELECT COUNT(*) as c FROM users WHERE school_id=? AND role='teacher' AND is_active=1", [$school['id']])['c'];

    success([
        'school'  => $school,
        'usage'   => ['students' => $studentCount, 'teachers' => $teacherCount],
        'limits'  => $limits,
    ]);
}

// ── PUT update settings ─────────────────────────────────────
if ($method === 'PUT') {
    $data = body();
    $allowed = ['name','welcome_text','phone','address','primary_color','report_template','about','founded_year','founder_name','motto','school_type','gallery','logo_url','onboarded'];
    $updates = []; $params = [];
    foreach ($allowed as $field) {
        if (isset($data[$field])) { $updates[] = "$field = ?"; $params[] = $data[$field]; }
    }
    if (empty($updates)) error('No valid fields to update');
    $params[] = $school['id'];
    query('UPDATE schools SET ' . implode(', ', $updates) . ' WHERE id = ?', $params);
    $updated = fetchOne('SELECT id, name, slug, email, logo_url, welcome_text, phone, address, primary_color, plan, wallet_balance, report_template, about, founded_year, founder_name, motto, school_type, gallery, onboarded FROM schools WHERE id = ?', [$school['id']]);
    success($updated, 'School updated');
}

error('Method not allowed', 405);
