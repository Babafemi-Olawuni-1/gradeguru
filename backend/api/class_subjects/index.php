<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user   = getAuthUser(['school_admin', 'teacher']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id']       ?? null;
$classId = $_GET['class_id'] ?? null;

// GET — list subjects assigned to a class (with teacher info)
if ($method === 'GET') {
    if (!$classId) error('class_id is required');

    // Verify class belongs to this school
    $class = fetchOne('SELECT id FROM classes WHERE id = ? AND school_id = ?', [$classId, $school['id']]);
    if (!$class) error('Class not found', 404);

    $rows = fetchAll(
        'SELECT cs.id, cs.class_id, cs.subject_id,
                s.name AS subject_name,
                ta.teacher_id,
                CONCAT(u.first_name, " ", u.last_name) AS teacher_name
         FROM class_subjects cs
         JOIN subjects s ON s.id = cs.subject_id
         LEFT JOIN teacher_assignments ta ON ta.class_subject_id = cs.id
         LEFT JOIN users u ON u.id = ta.teacher_id
         WHERE cs.class_id = ?
         ORDER BY s.name',
        [$classId]
    );
    success($rows);
}

// POST — assign a subject (and optionally a teacher) to a class
if ($method === 'POST') {
    getAuthUser(['school_admin']);
    $data   = body();
    $errors = validate($data, ['class_id' => 'required', 'subject_id' => 'required']);
    if ($errors) error('Validation failed', 422, $errors);

    // Verify class and subject belong to this school
    $class   = fetchOne('SELECT id FROM classes  WHERE id = ? AND school_id = ?', [$data['class_id'],   $school['id']]);
    $subject = fetchOne('SELECT id FROM subjects WHERE id = ? AND school_id = ?', [$data['subject_id'], $school['id']]);
    if (!$class)   error('Class not found',   404);
    if (!$subject) error('Subject not found', 404);

    // Check not already assigned
    $existing = fetchOne('SELECT id FROM class_subjects WHERE class_id = ? AND subject_id = ?',
        [$data['class_id'], $data['subject_id']]);
    if ($existing) error('This subject is already assigned to this class', 409);

    $csId = insert('INSERT INTO class_subjects (class_id, subject_id) VALUES (?, ?)',
        [$data['class_id'], $data['subject_id']]);

    // Optionally assign a teacher
    if (!empty($data['teacher_id'])) {
        $teacher = fetchOne("SELECT id FROM users WHERE id = ? AND school_id = ? AND role = 'teacher'",
            [$data['teacher_id'], $school['id']]);
        if ($teacher) {
            insert('INSERT INTO teacher_assignments (teacher_id, class_subject_id) VALUES (?, ?)',
                [$data['teacher_id'], $csId]);
        }
    }

    success(['id' => $csId], 'Subject assigned to class', 201);
}

// DELETE — remove a subject from a class
if ($method === 'DELETE') {
    getAuthUser(['school_admin']);
    if (!$id) error('ID required');

    // Verify the class_subject belongs to this school via the class
    $cs = fetchOne(
        'SELECT cs.id FROM class_subjects cs
         JOIN classes c ON c.id = cs.class_id
         WHERE cs.id = ? AND c.school_id = ?',
        [$id, $school['id']]
    );
    if (!$cs) error('Not found', 404);

    query('DELETE FROM class_subjects WHERE id = ?', [$id]);
    success(null, 'Subject removed from class');
}

error('Method not allowed', 405);
