<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Method not allowed', 405);

$data   = body();
$errors = validate($data, [
    'school_name' => 'required|max:200',
    'slug'        => 'required|slug',
    'email'       => 'required|email|max:200',
    'password'    => 'required|min:8',
]);
if ($errors) error('Validation failed', 422, $errors);

$slug  = strtolower(trim($data['slug']));
$email = strtolower(trim($data['email']));

// Check slug uniqueness
if (fetchOne('SELECT id FROM schools WHERE slug = ?', [$slug])) {
    // Suggest alternatives
    $suggestions = ["{$slug}-school", "{$slug}ng", "{$slug}1"];
    error('School URL is already taken', 409, ['slug' => "Try: " . implode(', ', $suggestions)]);
}

// Check email uniqueness
if (fetchOne('SELECT id FROM users WHERE email = ?', [$email])) {
    error('Email is already registered', 409);
}

// Auto-activate — no approval required
$status = 'active';

db()->beginTransaction();
try {
    $schoolId = insert(
        'INSERT INTO schools (name, slug, email, status, plan) VALUES (?, ?, ?, ?, ?)',
        [trim($data['school_name']), $slug, $email, $status, 'starter']
    );

    $hash = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
    $userId = insert(
        'INSERT INTO users (school_id, role, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [$schoolId, 'school_admin', trim($data['first_name'] ?? 'Admin'), trim($data['last_name'] ?? 'User'), $email, $hash]
    );

    // Default result template
    $grading = json_encode([
        ['min'=>75,'max'=>100,'grade'=>'A1','remark'=>'Excellent'],
        ['min'=>70,'max'=>74, 'grade'=>'B2','remark'=>'Very Good'],
        ['min'=>65,'max'=>69, 'grade'=>'B3','remark'=>'Good'],
        ['min'=>60,'max'=>64, 'grade'=>'C4','remark'=>'Credit'],
        ['min'=>55,'max'=>59, 'grade'=>'C5','remark'=>'Credit'],
        ['min'=>50,'max'=>54, 'grade'=>'C6','remark'=>'Credit'],
        ['min'=>45,'max'=>49, 'grade'=>'D7','remark'=>'Pass'],
        ['min'=>40,'max'=>44, 'grade'=>'E8','remark'=>'Pass'],
        ['min'=>0, 'max'=>39, 'grade'=>'F9','remark'=>'Fail'],
    ]);
    insert('INSERT INTO result_templates (school_id, grading_json) VALUES (?, ?)', [$schoolId, $grading]);

    db()->commit();
} catch (Exception $e) {
    db()->rollBack();
    error('Registration failed. Please try again.', 500);
}

success([
    'school_id' => $schoolId,
    'slug'      => $slug,
    'status'    => $status,
    'url'       => "gradeguru.com/{$slug}",
], $status === 'pending' ? 'Registration submitted, awaiting approval' : 'School registered successfully', 201);
