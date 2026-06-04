<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user   = getAuthUser(['school_admin', 'teacher']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

// GET — list all subjects for this school
if ($method === 'GET') {
    $subjects = fetchAll(
        'SELECT * FROM subjects WHERE school_id = ? ORDER BY name',
        [$school['id']]
    );
    success($subjects);
}

// POST — create subject (school_admin only)
if ($method === 'POST') {
    getAuthUser(['school_admin']);
    $data   = body();
    $errors = validate($data, ['name' => 'required|max:150']);
    if ($errors) error('Validation failed', 422, $errors);

    $name = trim($data['name']);
    if (fetchOne('SELECT id FROM subjects WHERE school_id = ? AND name = ?', [$school['id'], $name])) {
        error('A subject with this name already exists', 409);
    }

    $newId = insert('INSERT INTO subjects (school_id, name) VALUES (?, ?)', [$school['id'], $name]);
    success(fetchOne('SELECT * FROM subjects WHERE id = ?', [$newId]), 'Subject created', 201);
}

// PUT — rename subject
if ($method === 'PUT') {
    getAuthUser(['school_admin']);
    $id = $_GET['id'] ?? null;
    if (!$id) error('Subject ID required');
    $subject = fetchOne('SELECT id FROM subjects WHERE id = ? AND school_id = ?', [$id, $school['id']]);
    if (!$subject) error('Subject not found', 404);

    $data = body();
    $errors = validate($data, ['name' => 'required|max:150']);
    if ($errors) error('Validation failed', 422, $errors);

    $name = trim($data['name']);
    $existing = fetchOne('SELECT id FROM subjects WHERE school_id = ? AND name = ? AND id != ?', [$school['id'], $name, $id]);
    if ($existing) error('A subject with this name already exists', 409);

    query('UPDATE subjects SET name = ? WHERE id = ?', [$name, $id]);
    success(fetchOne('SELECT * FROM subjects WHERE id = ?', [$id]), 'Subject updated');
}

// DELETE — remove subject
if ($method === 'DELETE') {
    getAuthUser(['school_admin']);
    if (!$id) error('Subject ID required');
    $subject = fetchOne('SELECT id FROM subjects WHERE id = ? AND school_id = ?', [$id, $school['id']]);
    if (!$subject) error('Subject not found', 404);
    query('DELETE FROM subjects WHERE id = ?', [$id]);
    success(null, 'Subject deleted');
}

error('Method not allowed', 405);
