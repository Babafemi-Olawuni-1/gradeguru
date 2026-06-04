<?php
// PUBLIC endpoint — no auth required
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Method not allowed', 405);

$data   = body();
$errors = validate($data, [
    'slug'             => 'required',
    'pin_code'         => 'required',
    'admission_number' => 'required',
]);
if ($errors) error('Validation failed', 422, $errors);

$school = fetchOne("SELECT * FROM schools WHERE slug = ? AND status = 'active'", [strtolower(trim($data['slug']))]);
if (!$school) error('School not found', 404);

// Auto-expire
query("UPDATE pins SET status='expired' WHERE school_id = ? AND status='unused' AND expires_at < NOW()", [$school['id']]);

$pin = fetchOne('SELECT * FROM pins WHERE pin_code = ? AND school_id = ?', [strtoupper(trim($data['pin_code'])), $school['id']]);

if (!$pin) error('Invalid PIN. Please check and try again.', 404);
if ($pin['status'] === 'expired') error('This PIN has expired.', 410);
if ($pin['status'] === 'used') error('This PIN has already been used.', 409);

// Find student
$student = fetchOne(
    'SELECT * FROM students WHERE school_id = ? AND admission_number = ? AND is_active = 1',
    [$school['id'], trim($data['admission_number'])]
);
if (!$student) error('Admission number not found.', 404);

// If PIN is class-specific, validate
if ($pin['class_id'] && $pin['class_id'] != $student['class_id']) {
    error('This PIN is not valid for this student.', 403);
}

// Fetch published results
$results = fetchAll(
    'SELECT r.*, sub.name as subject_name
     FROM results r
     JOIN subjects sub ON sub.id = r.subject_id
     WHERE r.student_id = ? AND r.term_id = ? AND r.is_published = 1
     ORDER BY sub.name',
    [$student['id'], $pin['term_id']]
);

if (empty($results)) error('No published results found for this student and term.', 404);

// Mark PIN used
query("UPDATE pins SET status='used', used_at=NOW(), student_id=? WHERE id=?", [$student['id'], $pin['id']]);

// Fetch term info
$term    = fetchOne('SELECT t.name as term_name, s.name as session_name FROM terms t JOIN academic_sessions s ON s.id = t.session_id WHERE t.id = ?', [$pin['term_id']]);
$class   = fetchOne('SELECT name FROM classes WHERE id = ?', [$student['class_id']]);
$total   = array_sum(array_column($results, 'total'));
$average = count($results) > 0 ? round($total / count($results), 1) : 0;

success([
    'student' => [
        'name'             => $student['first_name'] . ' ' . $student['last_name'],
        'admission_number' => $student['admission_number'],
        'class'            => $class['name'] ?? '',
    ],
    'term'    => $term['term_name'] ?? '',
    'session' => $term['session_name'] ?? '',
    'school'  => ['name' => $school['name'], 'logo' => $school['logo_url']],
    'results' => array_map(fn($r) => [
        'subject' => $r['subject_name'],
        'ca1'     => $r['ca1'],
        'ca2'     => $r['ca2'],
        'exam'    => $r['exam'],
        'total'   => $r['total'],
        'grade'   => $r['grade'],
        'remark'  => $r['remark'],
    ], $results),
    'average' => $average,
    'school_allows_pdf' => true,
], 'Result retrieved successfully');
