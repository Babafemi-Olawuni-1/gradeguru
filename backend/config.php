<?php
// ── Production error handling ─────────────────────────────
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);
ini_set('log_errors', 1);
ini_set('error_log', __DIR__ . '/logs/php_errors.log');
if (!ob_get_level()) ob_start();

// ── Load .env file ────────────────────────────────────────
function loadEnv(string $path): void {
    if (!file_exists($path)) return;
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);
    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) continue;
        if (strpos($line, '=') === false) continue;
        [$key, $value] = explode('=', $line, 2);
        $key   = trim($key);
        $value = trim($value);
        // Strip inline comments
        if (strpos($value, ' #') !== false) {
            $value = trim(explode(' #', $value, 2)[0]);
        }
        if (!array_key_exists($key, $_ENV)) {
            $_ENV[$key] = $value;
            putenv("$key=$value");
        }
    }
}

loadEnv(__DIR__ . '/.env');

// ── Database ──────────────────────────────────────────────
define('DB_HOST', $_ENV['DB_HOST'] ?? 'localhost');
define('DB_USER', $_ENV['DB_USER'] ?? 'atayesef_gradeguru');
define('DB_PASS', $_ENV['DB_PASS'] ?? '');
define('DB_NAME', $_ENV['DB_NAME'] ?? 'atayesef_gradeguru');

// ── App settings ──────────────────────────────────────────
define('BASE_URL',           $_ENV['BASE_URL']      ?? 'https://gradeguru.atayesefm.com.ng/backend');
define('ALLOWED_ORIGIN',     $_ENV['ALLOWED_ORIGIN'] ?? 'https://gradeguru.atayesefm.com.ng');
define('TOKEN_EXPIRY_HOURS', 720); // 30 days
define('BCRYPT_COST',        12);
define('UPLOAD_DIR',         __DIR__ . '/uploads/');

// ── Paystack ──────────────────────────────────────────────
// Keys live in .env — change them there without touching code.
define('PAYSTACK_SECRET_KEY', $_ENV['PAYSTACK_SECRET_KEY'] ?? '');
define('PAYSTACK_PUBLIC_KEY', $_ENV['PAYSTACK_PUBLIC_KEY'] ?? '');

// ── Plan limits (Free = 10 students, 2 teachers) ──────────
define('PLAN_LIMITS', [
    'starter'    => ['students' => 10,           'teachers' => 2,           'id_cards' => 0,           'lesson_notes' => 0],
    'pro'        => ['students' => 200,           'teachers' => 10,          'id_cards' => 50,          'lesson_notes' => 20],
    'enterprise' => ['students' => PHP_INT_MAX,   'teachers' => PHP_INT_MAX, 'id_cards' => PHP_INT_MAX, 'lesson_notes' => PHP_INT_MAX],
]);

// ── Ensure upload and log directories exist ───────────────
foreach ([
    __DIR__ . '/logs',
    __DIR__ . '/uploads/logos',
    __DIR__ . '/uploads/gallery',
    __DIR__ . '/uploads/id_cards',
    __DIR__ . '/uploads/photos',
] as $dir) {
    if (!is_dir($dir)) {
        mkdir($dir, 0755, true);
    }
}
