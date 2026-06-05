<?php
// ── Production error suppression ─────────────────────────
ini_set('display_errors', 0);
error_reporting(0);

// ── IMPORTANT: This file ONLY inserts rows into existing tables.
//    It does NOT create databases, create tables, run schema.sql,
//    or check for table existence. The database atayesef_gradeguru
//    and all its tables already exist on cPanel.
// ─────────────────────────────────────────────────────────

require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';

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
    $suggestions = ["{$slug}-school", "{$slug}ng", "{$slug}1"];
    error('School URL is already taken', 409, ['slug' => 'Try: ' . implode(', ', $suggestions)]);
}

// Check email uniqueness
if (fetchOne('SELECT id FROM users WHERE email = ?', [$email])) {
    error('Email is already registered', 409);
}

// All new schools start active — no approval queue
$status = 'active';

db()->beginTransaction();
try {
    // 1. Insert school row
    $schoolId = insert(
        'INSERT INTO schools (name, slug, email, status, plan) VALUES (?, ?, ?, ?, ?)',
        [trim($data['school_name']), $slug, $email, $status, 'starter']
    );

    // 2. Insert school_admin user row
    $hash   = password_hash($data['password'], PASSWORD_BCRYPT, ['cost' => BCRYPT_COST]);
    insert(
        'INSERT INTO users (school_id, role, first_name, last_name, email, password_hash) VALUES (?, ?, ?, ?, ?, ?)',
        [
            $schoolId,
            'school_admin',
            trim($data['first_name'] ?? 'Admin'),
            trim($data['last_name']  ?? 'User'),
            $email,
            $hash,
        ]
    );

    // 3. Insert default Nigerian grading result_template
    $grading = json_encode([
        ['min' => 75, 'max' => 100, 'grade' => 'A1', 'remark' => 'Excellent'],
        ['min' => 70, 'max' => 74,  'grade' => 'B2', 'remark' => 'Very Good'],
        ['min' => 65, 'max' => 69,  'grade' => 'B3', 'remark' => 'Good'],
        ['min' => 60, 'max' => 64,  'grade' => 'C4', 'remark' => 'Credit'],
        ['min' => 55, 'max' => 59,  'grade' => 'C5', 'remark' => 'Credit'],
        ['min' => 50, 'max' => 54,  'grade' => 'C6', 'remark' => 'Credit'],
        ['min' => 45, 'max' => 49,  'grade' => 'D7', 'remark' => 'Pass'],
        ['min' => 40, 'max' => 44,  'grade' => 'E8', 'remark' => 'Pass'],
        ['min' => 0,  'max' => 39,  'grade' => 'F9', 'remark' => 'Fail'],
    ]);
    insert(
        'INSERT INTO result_templates (school_id, grading_json) VALUES (?, ?)',
        [$schoolId, $grading]
    );

    db()->commit();
} catch (Exception $e) {
    db()->rollBack();
    error_log('Registration failed: ' . $e->getMessage());
    error('Registration failed. Please try again.', 500);
}

success([
    'school_id' => $schoolId,
    'slug'      => $slug,
    'status'    => $status,
    'url'       => 'https://gradeguru.atayesefm.com.ng/s/' . $slug,
], 'School registered successfully', 201);
