<?php
// Suppress PHP warnings from polluting JSON responses
error_reporting(0);
ini_set('display_errors', 0);
if (!ob_get_level()) ob_start();

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_NAME', 'gradeguru');
define('BASE_URL', 'http://localhost/grade_guru/gradeguru/backend');
define('TOKEN_EXPIRY_HOURS', 720); // 30 days
define('BCRYPT_COST', 12);

// Plan limits
define('PLAN_LIMITS', [
    'starter'    => ['students' => 5,   'teachers' => 2,   'id_cards' => 0,  'lesson_notes' => 0],
    'pro'        => ['students' => 200, 'teachers' => 10,  'id_cards' => 50, 'lesson_notes' => 20],
    'enterprise' => ['students' => PHP_INT_MAX, 'teachers' => PHP_INT_MAX, 'id_cards' => PHP_INT_MAX, 'lesson_notes' => PHP_INT_MAX],
]);
