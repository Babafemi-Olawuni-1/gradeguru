<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../middleware/auth.php';

$user   = getAuthUser(['school_admin', 'teacher']);
$school = requireSchool($user);
$method = $_SERVER['REQUEST_METHOD'];

// ── GET gradebook / results ─────────────────────────────────
if ($method === 'GET') {
    $classId   = $_GET['class_id']   ?? null;
    $subjectId = $_GET['subject_id'] ?? null;
    $termId    = $_GET['term_id']    ?? null;

    if (!$classId || !$subjectId || !$termId) error('class_id, subject_id and term_id are required');

    // Teachers can only access their assigned class-subjects
    if ($user['role'] === 'teacher') {
        $assigned = fetchOne(
            'SELECT ta.id FROM teacher_assignments ta
             JOIN class_subjects cs ON cs.id = ta.class_subject_id
             WHERE ta.teacher_id = ? AND cs.class_id = ? AND cs.subject_id = ?',
            [$user['user_id'], $classId, $subjectId]
        );
        if (!$assigned) error('You are not assigned to this class-subject', 403);
    }

    $results = fetchAll(
        'SELECT r.*, s.first_name, s.last_name, s.admission_number
         FROM results r
         JOIN students s ON s.id = r.student_id
         WHERE r.school_id = ? AND r.class_id = ? AND r.subject_id = ? AND r.term_id = ?
         ORDER BY s.last_name, s.first_name',
        [$school['id'], $classId, $subjectId, $termId]
    );

    // Students without results yet
    $students = fetchAll(
        'SELECT id, first_name, last_name, admission_number FROM students WHERE school_id = ? AND class_id = ? AND is_active = 1',
        [$school['id'], $classId]
    );

    success(['results' => $results, 'students' => $students]);
}

// ── POST save/update result ─────────────────────────────────
if ($method === 'POST') {
    $data   = body();
    $errors = validate($data, [
        'student_id' => 'required|numeric',
        'class_id'   => 'required|numeric',
        'subject_id' => 'required|numeric',
        'term_id'    => 'required|numeric',
    ]);
    if ($errors) error('Validation failed', 422, $errors);

    $ca1  = min((float)($data['ca1']  ?? 0), 20);
    $ca2  = min((float)($data['ca2']  ?? 0), 20);
    $exam = min((float)($data['exam'] ?? 0), 60);
    $total = $ca1 + $ca2 + $exam;

    // Compute grade from template
    $template = fetchOne('SELECT * FROM result_templates WHERE school_id = ? AND is_active = 1', [$school['id']]);
    $grade = 'F9'; $remark = 'Fail';
    if ($template) {
        foreach (json_decode($template['grading_json'], true) as $g) {
            if ($total >= $g['min'] && $total <= $g['max']) {
                $grade = $g['grade']; $remark = $g['remark']; break;
            }
        }
    }

    // Upsert
    $existing = fetchOne(
        'SELECT id FROM results WHERE student_id=? AND subject_id=? AND term_id=?',
        [$data['student_id'], $data['subject_id'], $data['term_id']]
    );

    if ($existing) {
        query('UPDATE results SET ca1=?,ca2=?,exam=?,grade=?,remark=?,teacher_id=? WHERE id=?',
            [$ca1, $ca2, $exam, $grade, $remark, $user['user_id'], $existing['id']]);
        $resultId = $existing['id'];
    } else {
        $resultId = insert(
            'INSERT INTO results (school_id,student_id,class_id,subject_id,term_id,teacher_id,ca1,ca2,exam,grade,remark) VALUES (?,?,?,?,?,?,?,?,?,?,?)',
            [$school['id'], $data['student_id'], $data['class_id'], $data['subject_id'], $data['term_id'], $user['user_id'], $ca1, $ca2, $exam, $grade, $remark]
        );
    }

    success(fetchOne('SELECT * FROM results WHERE id = ?', [$resultId]), 'Result saved');
}

// ── PUT publish ─────────────────────────────────────────────
if ($method === 'PUT') {
    $user = getAuthUser(['school_admin']);
    $data = body();
    if (empty($data['class_id']) || empty($data['term_id'])) error('class_id and term_id required');

    $existing = fetchOne(
        'SELECT COUNT(*) as c FROM results WHERE school_id=? AND class_id=? AND term_id=? AND is_published=1',
        [$school['id'], $data['class_id'], $data['term_id']]
    );
    if ($existing['c'] > 0 && empty($data['confirm'])) {
        error('Results already published for this class/term. Send confirm=true to overwrite.', 409);
    }

    query('UPDATE results SET is_published=1, published_at=NOW() WHERE school_id=? AND class_id=? AND term_id=?',
        [$school['id'], $data['class_id'], $data['term_id']]);

    success(null, 'Results published successfully');
}

error('Method not allowed', 405);
