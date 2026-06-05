<?php
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config.php';

$user   = getAuthUser(['school_admin', 'teacher']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

// ── GET list or single ──────────────────────────────────────
if ($method === 'GET') {
    if ($id) {
        $student = fetchOne('SELECT * FROM students WHERE id = ? AND school_id = ?', [$id, $school['id']]);
        if (!$student) error('Student not found', 404);
        success($student);
    }

    $page    = max(1, (int)($_GET['page'] ?? 1));
    $perPage = min(100, (int)($_GET['per_page'] ?? 20));
    $offset  = ($page - 1) * $perPage;
    $search  = '%' . ($_GET['search'] ?? '') . '%';
    $classId = $_GET['class_id'] ?? null;

    // Only query columns that exist in the schema
    $where  = 's.school_id = ? AND s.is_active = 1 AND (s.first_name LIKE ? OR s.last_name LIKE ? OR s.admission_number LIKE ?)';
    $params = [$school['id'], $search, $search, $search];

    if ($classId) { $where .= ' AND s.class_id = ?'; $params[] = $classId; }

    $total    = fetchOne("SELECT COUNT(*) as c FROM students s WHERE $where", $params)['c'];
    $students = fetchAll(
        "SELECT s.*, c.name as class_name
         FROM students s
         LEFT JOIN classes c ON c.id = s.class_id
         WHERE $where
         ORDER BY s.last_name, s.first_name
         LIMIT $perPage OFFSET $offset",
        $params
    );

    success(paginate($students, $total, $page, $perPage));
}

// ── POST create ─────────────────────────────────────────────
if ($method === 'POST') {
    $user = getAuthUser(['school_admin']);
    $data = body();
    $errors = validate($data, [
        'first_name'       => 'required|max:100',
        'last_name'        => 'required|max:100',
        'admission_number' => 'required|max:100',
    ]);
    if ($errors) error('Validation failed', 422, $errors);

    // Plan limit check
    $limits = PLAN_LIMITS[$school['plan']];
    $count  = fetchOne('SELECT COUNT(*) as c FROM students WHERE school_id = ? AND is_active = 1', [$school['id']])['c'];
    if ($count >= $limits['students']) {
        error("Student limit reached for {$school['plan']} plan ({$limits['students']} max). Please upgrade.", 403);
    }

    // Duplicate admission number check
    if (fetchOne('SELECT id FROM students WHERE school_id = ? AND admission_number = ?', [$school['id'], trim($data['admission_number'])])) {
        error('Admission number already exists in this school', 409);
    }

    $newId = insert(
        'INSERT INTO students (school_id, class_id, first_name, last_name, admission_number, date_of_birth, photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            $school['id'],
            $data['class_id']      ?? null,
            trim($data['first_name']),
            trim($data['last_name']),
            trim($data['admission_number']),
            $data['date_of_birth'] ?? null,
            $data['photo_url']     ?? null,
        ]
    );
    success(fetchOne('SELECT * FROM students WHERE id = ?', [$newId]), 'Student created', 201);
}

// ── PUT update ──────────────────────────────────────────────
if ($method === 'PUT') {
    $user = getAuthUser(['school_admin']);
    if (!$id) error('Student ID required');
    $student = fetchOne('SELECT * FROM students WHERE id = ? AND school_id = ?', [$id, $school['id']]);
    if (!$student) error('Student not found', 404);

    $data = body();
    query(
        'UPDATE students SET first_name=?, last_name=?, class_id=?, date_of_birth=?, photo_url=?, is_active=? WHERE id=?',
        [
            $data['first_name']    ?? $student['first_name'],
            $data['last_name']     ?? $student['last_name'],
            array_key_exists('class_id', $data) ? $data['class_id'] : $student['class_id'],
            $data['date_of_birth'] ?? $student['date_of_birth'],
            $data['photo_url']     ?? $student['photo_url'],
            isset($data['is_active']) ? (int)$data['is_active'] : $student['is_active'],
            $id,
        ]
    );
    success(fetchOne('SELECT * FROM students WHERE id = ?', [$id]), 'Student updated');
}

// ── DELETE deactivate ───────────────────────────────────────
if ($method === 'DELETE') {
    $user = getAuthUser(['school_admin']);
    if (!$id) error('Student ID required');
    $student = fetchOne('SELECT id FROM students WHERE id = ? AND school_id = ?', [$id, $school['id']]);
    if (!$student) error('Student not found', 404);
    query('UPDATE students SET is_active = 0 WHERE id = ?', [$id]);
    success(null, 'Student deactivated');
}

error('Method not allowed', 405);
