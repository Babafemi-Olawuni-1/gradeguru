<?php
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Method not allowed', 405);

$user = getAuthUser();
query('DELETE FROM auth_tokens WHERE user_id = ?', [$user['user_id']]);
success(null, 'Logged out successfully');
