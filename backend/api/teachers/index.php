<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';
require_once __DIR__ . '/../../config.php';

$user   = getAuthUser(['school_admin']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

if ($method === 'GET') {
    $teachers = fetchAll(
        "SELECT u.id, u.first_name, u.last_name, u.email, u.is_active, u.created_at,
                GROUP_CONCAT(CONCAT(c.name,' - ',sub.name) SEPARATOR '; ') as assignments
         FROM users u
         LEFT JOIN teacher_assignments ta ON ta.teacher_id = u.id
         LEFT JOIN class_subjects cs ON cs.id = ta.class_subject_id
         LEFT JOIN classes c ON c.id = cs.class_id
         LEFT JOIN subjects sub ON sub.id = cs.subject_id
         WHERE u.school_id = ? AND u.role = 'teacher'
         GROUP BY u.id ORDER BY u.last_name",
        [$school['id']]
    );
    success($teachers);
}

if ($method === 'POST') {
    $data   = body();
    $errors = validate($data, [
        'first_name' => 'required|max:100',
        'last_name'  => 'required|max:100',
        'email'      => 'required|email',
        'password'   => 'required|min:8',
    ]);
    if ($errors) error('Validation failed', 422, $errors);

    $limits = PLAN_LIMITS[$school['plan']];
    $count  = fetchOne("SELECT COUNT(*) as c FROM users WHERE school_id=? AND role='teacher' AND is_active=1", [$school['id']])['c'];
    if ($count >= $limits['teachers']) {
        error("Teacher limit reached for {$school['plan']} plan ({$limits['teachers']} max). Please upgrade.", 403);
    }

    if (fetchOne('SELECT id FROM users WHERE email = ?', [strtolower($data['email'])])) {
        error('Email already in use', 409);
    }

    $hash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
    $tid  = insert(
        'INSERT INTO users (school_id, role, first_name, last_name, email, password_hash) VALUES (?,?,?,?,?,?)',
        [$school['id'], 'teacher', $data['first_name'], $data['last_name'], strtolower($data['email']), $hash]
    );
    success(fetchOne('SELECT id,first_name,last_name,email,is_active FROM users WHERE id=?', [$tid]), 'Teacher created', 201);
}

if ($method === 'DELETE') {
    if (!$id) error('Teacher ID required');
    $teacher = fetchOne("SELECT id FROM users WHERE id=? AND school_id=? AND role='teacher'", [$id, $school['id']]);
    if (!$teacher) error('Teacher not found', 404);
    query('UPDATE users SET is_active=0 WHERE id=?', [$id]);
    success(null, 'Teacher deactivated');
}

if ($method === 'PUT') {
    if (!$id) error('Teacher ID required');
    $teacher = fetchOne("SELECT id FROM users WHERE id=? AND school_id=? AND role='teacher'", [$id, $school['id']]);
    if (!$teacher) error('Teacher not found', 404);

    $data = body();
    $errors = validate($data, [
        'first_name' => 'required|max:100',
        'last_name'  => 'required|max:100',
    ]);
    if ($errors) error('Validation failed', 422, $errors);

    if (!empty($data['password'])) {
        if (strlen($data['password']) < 8) error('Password must be at least 8 characters');
        $hash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
        query('UPDATE users SET first_name=?, last_name=?, password_hash=? WHERE id=?',
            [$data['first_name'], $data['last_name'], $hash, $id]);
    } else {
        query('UPDATE users SET first_name=?, last_name=? WHERE id=?',
            [$data['first_name'], $data['last_name'], $id]);
    }

    success(fetchOne('SELECT id,first_name,last_name,email,is_active FROM users WHERE id=?', [$id]), 'Teacher updated');
}

error('Method not allowed', 405);
