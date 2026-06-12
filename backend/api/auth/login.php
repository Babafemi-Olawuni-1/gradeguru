<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../helpers/validate.php';
require_once __DIR__ . '/../../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Method not allowed', 405);

$data = body();

// Accept either email/password (admin) or username/password (teacher)
$loginType = $data['login_type'] ?? 'email'; // 'email' | 'username'

if ($loginType === 'username') {
    // Teacher login via username
    $errors = validate($data, ['username' => 'required', 'password' => 'required']);
    if ($errors) error('Validation failed', 422, $errors);

    $username = strtolower(trim($data['username']));
    $user     = fetchOne("SELECT * FROM users WHERE username = ? AND role = 'teacher'", [$username]);
    if (!$user) error('Invalid username or password', 401);
} else {
    // Admin / super admin login via email
    $errors = validate($data, ['email' => 'required|email', 'password' => 'required']);
    if ($errors) error('Validation failed', 422, $errors);

    $email = strtolower(trim($data['email']));
    $user  = fetchOne('SELECT * FROM users WHERE email = ?', [$email]);
    if (!$user) error('Invalid email or password', 401);
}

// Check account lock
if ($user['locked_until'] && strtotime($user['locked_until']) > time()) {
    $mins = ceil((strtotime($user['locked_until']) - time()) / 60);
    error("Account locked. Try again in {$mins} minute(s).", 429);
}

// Verify password
if (!password_verify($data['password'], $user['password_hash'])) {
    $fails = $user['failed_logins'] + 1;
    if ($fails >= 5) {
        $lockUntil = date('Y-m-d H:i:s', strtotime('+15 minutes'));
        query('UPDATE users SET failed_logins = ?, locked_until = ? WHERE id = ?', [$fails, $lockUntil, $user['id']]);
        error('Too many failed attempts. Account locked for 15 minutes.', 429);
    }
    query('UPDATE users SET failed_logins = ? WHERE id = ?', [$fails, $user['id']]);

    if ($loginType === 'username') {
        error('Invalid username or password', 401);
    } else {
        error('Invalid email or password', 401);
    }
}

if (!$user['is_active']) error('Account is inactive', 403);

// Check school status for non-super-admins
$school = null;
if ($user['role'] !== 'super_admin') {
    $school = fetchOne('SELECT * FROM schools WHERE id = ?', [$user['school_id']]);
    if ($school && $school['status'] === 'suspended') error('This school account has been suspended', 403);
    if ($school && $school['status'] === 'pending')   error('School registration is pending approval', 403);
}

// Clean up expired tokens
query('DELETE FROM auth_tokens WHERE expires_at < NOW()');

// Issue new token
$token     = bin2hex(random_bytes(32));
$expiresAt = date('Y-m-d H:i:s', strtotime('+' . TOKEN_EXPIRY_HOURS . ' hours'));
insert('INSERT INTO auth_tokens (user_id, token, expires_at) VALUES (?, ?, ?)', [$user['id'], $token, $expiresAt]);

// Reset failed logins
query('UPDATE users SET failed_logins = 0, locked_until = NULL, last_login_at = NOW() WHERE id = ?', [$user['id']]);

success([
    'token'      => $token,
    'expires_at' => $expiresAt,
    'user' => [
        'id'         => $user['id'],
        'role'       => $user['role'],
        'first_name' => $user['first_name'],
        'last_name'  => $user['last_name'],
        'email'      => $user['email'],
        'username'   => $user['username'] ?? null,
        'school_id'  => $user['school_id'],
    ],
    'school' => $school ? [
        'id'            => $school['id'],
        'name'          => $school['name'],
        'slug'          => $school['slug'],
        'plan'          => $school['plan'],
        'wallet'        => $school['wallet_balance'],
        'logo_url'      => $school['logo_url'],
        'primary_color' => $school['primary_color'],
        'onboarded'     => (bool)$school['onboarded'],
    ] : null,
], 'Login successful');
