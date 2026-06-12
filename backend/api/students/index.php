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
    getAuthUser(['school_admin']); // re-check role
    $data = body();
    $errors = validate($data, [
        'first_name'       => 'required|max:100',
        'admission_number' => 'required|max:100',
    ]);
    if ($errors) error('Validation failed', 422, $errors);

    // Plan limit check
    $limits = PLAN_LIMITS[$school['plan']];
    $count  = fetchOne('SELECT COUNT(*) as c FROM students WHERE school_id = ? AND is_active = 1', [$school['id']])['c'];
    if ($limits['students'] !== PHP_INT_MAX && $count >= $limits['students']) {
        error("Student limit reached for {$school['plan']} plan ({$limits['students']} max). Please upgrade.", 403);
    }

    // Duplicate admission number check
    $admNo = trim($data['admission_number']);
    if (fetchOne('SELECT id FROM students WHERE school_id = ? AND admission_number = ?', [$school['id'], $admNo])) {
        error('Admission number already exists for this school', 409);
    }

    // Map form fields: surname → last_name if provided, last_name stays as other_name
    // Frontend sends: surname, first_name, last_name (other name), admission_number, class_id, dob, sex, photo_url
    // DB columns: first_name, last_name, admission_number, class_id, date_of_birth, photo_url
    // We store: last_name = surname (family name), first_name = first_name
    // "Other name" from the form (form.last_name) is stored in last_name if no surname provided
    $firstName = trim($data['first_name']);
    $lastName  = trim($data['surname'] ?? $data['last_name'] ?? '');
    $otherName = !empty($data['surname']) ? trim($data['last_name'] ?? '') : '';

    // Combine other name into last_name if present
    // Store as: last_name = "Surname" (from surname field), first_name = first_name
    // We'll store surname in last_name column and concatenate other name
    if (!empty($otherName)) {
        $lastName = trim($lastName . ' ' . $otherName);
    }

    $newId = insert(
        'INSERT INTO students (school_id, class_id, first_name, last_name, admission_number, date_of_birth, photo_url)
         VALUES (?, ?, ?, ?, ?, ?, ?)',
        [
            $school['id'],
            !empty($data['class_id']) ? (int)$data['class_id'] : null,
            $firstName,
            $lastName,
            $admNo,
            !empty($data['date_of_birth']) ? $data['date_of_birth'] : null,
            $data['photo_url'] ?? null,
        ]
    );

    $student = fetchOne(
        'SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ?',
        [$newId]
    );
    // Add virtual fields for frontend display
    $student['surname'] = $lastName;
    $student['sex']     = $data['sex'] ?? '';

    success($student, 'Student created', 201);
}

// ── PUT update ──────────────────────────────────────────────
if ($method === 'PUT') {
    getAuthUser(['school_admin']); // re-check role
    if (!$id) error('Student ID required');
    $student = fetchOne('SELECT * FROM students WHERE id = ? AND school_id = ?', [$id, $school['id']]);
    if (!$student) error('Student not found', 404);

    $data = body();

    $firstName = trim($data['first_name'] ?? $student['first_name']);

    // Handle surname/last_name mapping same as POST
    if (array_key_exists('surname', $data)) {
        $surname   = trim($data['surname'] ?? '');
        $otherName = trim($data['last_name'] ?? '');
        $lastName  = !empty($otherName) ? trim($surname . ' ' . $otherName) : $surname;
        if (empty($lastName)) $lastName = $student['last_name']; // keep existing if empty
    } else {
        $lastName = trim($data['last_name'] ?? $student['last_name']);
    }

    $classId = array_key_exists('class_id', $data)
        ? (!empty($data['class_id']) ? (int)$data['class_id'] : null)
        : $student['class_id'];

    $dob      = !empty($data['date_of_birth']) ? $data['date_of_birth'] : $student['date_of_birth'];
    $photoUrl = array_key_exists('photo_url', $data) ? $data['photo_url'] : $student['photo_url'];
    $isActive = isset($data['is_active']) ? (int)$data['is_active'] : $student['is_active'];

    query(
        'UPDATE students SET first_name=?, last_name=?, class_id=?, date_of_birth=?, photo_url=?, is_active=? WHERE id=?',
        [$firstName, $lastName, $classId, $dob, $photoUrl, $isActive, $id]
    );

    $updated = fetchOne(
        'SELECT s.*, c.name as class_name FROM students s LEFT JOIN classes c ON c.id = s.class_id WHERE s.id = ?',
        [$id]
    );
    success($updated, 'Student updated');
}

// ── DELETE deactivate ───────────────────────────────────────
if ($method === 'DELETE') {
    getAuthUser(['school_admin']); // re-check role
    if (!$id) error('Student ID required');
    $student = fetchOne('SELECT id FROM students WHERE id = ? AND school_id = ?', [$id, $school['id']]);
    if (!$student) error('Student not found', 404);
    query('UPDATE students SET is_active = 0 WHERE id = ?', [$id]);
    success(null, 'Student deactivated');
}

error('Method not allowed', 405);
