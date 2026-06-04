<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user   = getAuthUser(['school_admin']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];
$id     = $_GET['id'] ?? null;

if ($method === 'GET') {
    $announcements = fetchAll(
        'SELECT * FROM announcements WHERE school_id=? ORDER BY created_at DESC',
        [$school['id']]
    );
    success($announcements);
}

if ($method === 'POST') {
    $data   = body();
    $errors = validate($data, ['title' => 'required|max:255', 'body' => 'required']);
    if ($errors) error('Validation failed', 422, $errors);
    $aid = insert('INSERT INTO announcements (school_id,title,body,publish_at,is_published) VALUES (?,?,?,?,?)',
        [$school['id'], $data['title'], $data['body'], $data['publish_at'] ?? null, $data['is_published'] ?? 1]);
    success(fetchOne('SELECT * FROM announcements WHERE id=?', [$aid]), 'Announcement created', 201);
}

if ($method === 'PUT') {
    if (!$id) error('ID required');
    $ann = fetchOne('SELECT id FROM announcements WHERE id=? AND school_id=?', [$id, $school['id']]);
    if (!$ann) error('Not found', 404);
    $data = body();
    query('UPDATE announcements SET title=?,body=?,publish_at=?,is_published=? WHERE id=?',
        [$data['title'], $data['body'], $data['publish_at'] ?? null, $data['is_published'] ?? 1, $id]);
    success(fetchOne('SELECT * FROM announcements WHERE id=?', [$id]), 'Updated');
}

if ($method === 'DELETE') {
    if (!$id) error('ID required');
    $ann = fetchOne('SELECT id FROM announcements WHERE id=? AND school_id=?', [$id, $school['id']]);
    if (!$ann) error('Not found', 404);
    query('DELETE FROM announcements WHERE id=?', [$id]);
    success(null, 'Deleted');
}

error('Method not allowed', 405);
