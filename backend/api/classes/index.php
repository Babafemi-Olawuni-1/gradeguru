<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user   = getAuthUser(['school_admin', 'teacher']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

if ($method === 'GET') {
    $classes = fetchAll(
        'SELECT c.*, COUNT(s.id) as student_count
         FROM classes c
         LEFT JOIN students s ON s.class_id = c.id AND s.is_active = 1
         WHERE c.school_id = ?
         GROUP BY c.id ORDER BY c.name',
        [$school['id']]
    );
    success($classes);
}

if ($method === 'POST') {
    $user = getAuthUser(['school_admin']);
    $data = body();
    $errors = validate($data, ['name' => 'required|max:100']);
    if ($errors) error('Validation failed', 422, $errors);

    if (fetchOne('SELECT id FROM classes WHERE school_id = ? AND name = ?', [$school['id'], trim($data['name'])])) {
        error('A class with this name already exists', 409);
    }

    $id = insert('INSERT INTO classes (school_id, name, description) VALUES (?, ?, ?)',
        [$school['id'], trim($data['name']), $data['description'] ?? null]);
    success(fetchOne('SELECT * FROM classes WHERE id = ?', [$id]), 'Class created', 201);
}

if ($method === 'DELETE') {
    $user = getAuthUser(['school_admin']);
    if (!$id) error('Class ID required');
    $class = fetchOne('SELECT id FROM classes WHERE id = ? AND school_id = ?', [$id, $school['id']]);
    if (!$class) error('Class not found', 404);
    query('DELETE FROM classes WHERE id = ?', [$id]);
    success(null, 'Class deleted');
}

error('Method not allowed', 405);
