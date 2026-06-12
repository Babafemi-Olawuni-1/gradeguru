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

// ── Helper: generate unique username ───────────────────────
function generateUsername(string $firstName, string $lastName, string $schoolSlug): string {
    $base = strtolower(
        preg_replace('/[^a-z0-9]/', '', $firstName) .
        '.' .
        preg_replace('/[^a-z0-9]/', '', $lastName)
    );
    if (strlen($base) < 3) $base = 'teacher.' . $base;
    // Add school slug prefix for uniqueness across schools
    $candidate = $schoolSlug . '_' . $base;

    // Check uniqueness in users table (username column)
    $attempt = $candidate;
    $counter = 1;
    while (fetchOne('SELECT id FROM users WHERE username = ?', [$attempt])) {
        $attempt = $candidate . $counter;
        $counter++;
    }
    return $attempt;
}

// ── GET list ────────────────────────────────────────────────
if ($method === 'GET') {
    $teachers = fetchAll(
        "SELECT u.id, u.first_name, u.last_name, u.email, u.username, u.is_active, u.created_at,
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

// ── POST create ─────────────────────────────────────────────
if ($method === 'POST') {
    $data   = body();
    $errors = validate($data, [
        'first_name' => 'required|max:100',
        'last_name'  => 'required|max:100',
    ]);
    if ($errors) error('Validation failed', 422, $errors);

    // Plan limit check
    $limits = PLAN_LIMITS[$school['plan']];
    $count  = fetchOne("SELECT COUNT(*) as c FROM users WHERE school_id=? AND role='teacher' AND is_active=1", [$school['id']])['c'];
    if ($limits['teachers'] !== PHP_INT_MAX && $count >= $limits['teachers']) {
        error("Teacher limit reached for {$school['plan']} plan ({$limits['teachers']} max). Please upgrade.", 403);
    }

    $firstName = trim($data['first_name']);
    $lastName  = trim($data['last_name']);

    // Generate unique username
    $username = generateUsername($firstName, $lastName, $school['slug']);

    // Default password = school name (slugified, all lowercase, no spaces)
    $defaultPassword = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $school['name']));
    if (strlen($defaultPassword) < 6) $defaultPassword = $defaultPassword . '123';

    $hash = password_hash($defaultPassword, PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);

    // Email is optional for teachers — generate a placeholder if not provided
    $email = !empty($data['email']) ? strtolower(trim($data['email'])) : null;
    if ($email && fetchOne('SELECT id FROM users WHERE email = ?', [$email])) {
        error('Email already in use', 409);
    }
    // If no email, generate a placeholder
    if (!$email) {
        $email = $username . '@' . $school['slug'] . '.gradeguru.local';
    }

    $tid = insert(
        'INSERT INTO users (school_id, role, first_name, last_name, email, username, password_hash) VALUES (?,?,?,?,?,?,?)',
        [$school['id'], 'teacher', $firstName, $lastName, $email, $username, $hash]
    );

    $teacher = fetchOne('SELECT id, first_name, last_name, email, username, is_active FROM users WHERE id=?', [$tid]);
    $teacher['default_password'] = $defaultPassword; // Return once so admin can share with teacher

    success($teacher, 'Teacher created', 201);
}

// ── PUT update ──────────────────────────────────────────────
if ($method === 'PUT') {
    if (!$id) error('Teacher ID required');
    $teacher = fetchOne("SELECT id FROM users WHERE id=? AND school_id=? AND role='teacher'", [$id, $school['id']]);
    if (!$teacher) error('Teacher not found', 404);

    $data   = body();
    $errors = validate($data, [
        'first_name' => 'required|max:100',
        'last_name'  => 'required|max:100',
    ]);
    if ($errors) error('Validation failed', 422, $errors);

    if (!empty($data['password'])) {
        if (strlen($data['password']) < 6) error('Password must be at least 6 characters');
        $hash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
        query('UPDATE users SET first_name=?, last_name=?, password_hash=? WHERE id=?',
            [trim($data['first_name']), trim($data['last_name']), $hash, $id]);
    } else {
        query('UPDATE users SET first_name=?, last_name=? WHERE id=?',
            [trim($data['first_name']), trim($data['last_name']), $id]);
    }

    success(fetchOne('SELECT id,first_name,last_name,email,username,is_active FROM users WHERE id=?', [$id]), 'Teacher updated');
}

// ── DELETE deactivate ───────────────────────────────────────
if ($method === 'DELETE') {
    if (!$id) error('Teacher ID required');
    $teacher = fetchOne("SELECT id FROM users WHERE id=? AND school_id=? AND role='teacher'", [$id, $school['id']]);
    if (!$teacher) error('Teacher not found', 404);
    query('UPDATE users SET is_active=0 WHERE id=?', [$id]);
    success(null, 'Teacher deactivated');
}

error('Method not allowed', 405);
