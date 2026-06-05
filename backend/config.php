<?php
// ── Production error handling ─────────────────────────────
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/php_errors.log');
if (!ob_get_level()) ob_start();

// ── Database (cPanel MySQL) ───────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'atayesef_gradeguru');
define('DB_PASS', '3vYj9D73H6g23xhndFcU');
define('DB_NAME', 'atayesef_gradeguru');

// ── App settings ─────────────────────────────────────────
define('BASE_URL',           'https://gradeguru.atayesefm.com.ng/backend');
define('ALLOWED_ORIGIN',     'https://gradeguru.atayesefm.com.ng');
define('TOKEN_EXPIRY_HOURS', 720); // 30 days
define('BCRYPT_COST',        12);
define('UPLOAD_DIR',         __DIR__ . '/uploads/');

// ── Plan limits ───────────────────────────────────────────
define('PLAN_LIMITS', [
    'starter'    => ['students' => 5,             'teachers' => 2,             'id_cards' => 0,             'lesson_notes' => 0],
    'pro'        => ['students' => 200,            'teachers' => 10,            'id_cards' => 50,            'lesson_notes' => 20],
    'enterprise' => ['students' => PHP_INT_MAX,    'teachers' => PHP_INT_MAX,   'id_cards' => PHP_INT_MAX,   'lesson_notes' => PHP_INT_MAX],
]);

// ── Ensure upload and log directories exist ───────────────
foreach ([
    __DIR__ . '/logs',
    __DIR__ . '/uploads/logos',
    __DIR__ . '/uploads/gallery',
    __DIR__ . '/uploads/id_cards',
] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}
