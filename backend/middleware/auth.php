<?php
require_once __DIR__ . '/../helpers/db.php';
require_once __DIR__ . '/../helpers/response.php';

function getAuthUser(array $allowedRoles = []): array {
    $headers = getallheaders();
    $authHeader = $headers['Authorization'] ?? $headers['authorization'] ?? '';

    if (!preg_match('/Bearer\s+(.+)/i', $authHeader, $m)) {
        error('Unauthorized — no token provided', 401);
    }

    $token = trim($m[1]);
    $row = fetchOne(
        'SELECT t.*, u.id as user_id, u.role, u.school_id, u.first_name, u.last_name, u.email, u.is_active
         FROM auth_tokens t
         JOIN users u ON u.id = t.user_id
         WHERE t.token = ? AND t.expires_at > NOW()',
        [$token]
    );

    if (!$row) error('Unauthorized — invalid or expired token', 401);
    if (!$row['is_active']) error('Account is inactive', 403);

    if ($allowedRoles && !in_array($row['role'], $allowedRoles)) {
        error('Forbidden — insufficient permissions', 403);
    }

    return $row;
}

function requireSchool(array $user): array {
    if (!$user['school_id']) error('No school associated with this account', 403);
    $school = fetchOne('SELECT * FROM schools WHERE id = ?', [$user['school_id']]);
    if (!$school) error('School not found', 404);
    if ($school['status'] === 'suspended') error('This school account has been suspended', 403);
    return $school;
}
