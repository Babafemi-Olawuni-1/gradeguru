<?php
/**
 * GradeGuru Diagnostic Endpoint
 * Access: https://gradeguru.atayesefm.com.ng/backend/api/debug.php
 * DELETE THIS FILE after confirming everything works on production.
 */

ini_set('display_errors', 1);
error_reporting(E_ALL);
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$out = [];

// ── 1. PHP info ───────────────────────────────────────────
$out['php_version']       = PHP_VERSION;
$out['pdo_mysql_loaded']  = extension_loaded('pdo_mysql');
$out['pdo_loaded']        = extension_loaded('pdo');
$out['extensions_loaded'] = array_values(array_filter(
    get_loaded_extensions(),
    fn($e) => in_array(strtolower($e), ['pdo','pdo_mysql','pdo_pgsql','mysqli','json','mbstring'])
));

// ── 2. Config path check ──────────────────────────────────
$configPath = __DIR__ . '/../config.php';
$out['config_exists'] = file_exists($configPath);

if ($out['config_exists']) {
    require_once $configPath;
    $out['db_host'] = DB_HOST;
    $out['db_name'] = DB_NAME;
    $out['db_user'] = DB_USER;
    // Never expose DB_PASS
} else {
    $out['config_error'] = 'config.php not found at: ' . $configPath;
    echo json_encode($out, JSON_PRETTY_PRINT);
    exit;
}

// ── 3. Database connection ────────────────────────────────
try {
    $pdo = new PDO(
        'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
        DB_USER,
        DB_PASS,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );
    $out['db_connection'] = 'OK';
    $out['db_driver']     = $pdo->getAttribute(PDO::ATTR_DRIVER_NAME);
    $out['server_version']= $pdo->getAttribute(PDO::ATTR_SERVER_VERSION);
} catch (PDOException $e) {
    $out['db_connection'] = 'FAILED';
    $out['db_error']      = $e->getMessage();
    echo json_encode($out, JSON_PRETTY_PRINT);
    exit;
}

// ── 4. Table existence check ──────────────────────────────
$required_tables = [
    'schools','users','auth_tokens','students','classes','subjects',
    'class_subjects','terms','academic_sessions','results','result_templates',
    'pins','transactions','announcements','platform_settings'
];
$existing = $pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
$out['tables_found']   = $existing;
$out['tables_missing'] = array_values(array_diff($required_tables, $existing));
$out['tables_ok']      = empty($out['tables_missing']);

// ── 5. Schools table — columns ────────────────────────────
try {
    $cols = $pdo->query("SHOW COLUMNS FROM schools")->fetchAll(PDO::FETCH_COLUMN);
    $out['schools_columns'] = $cols;
} catch (Exception $e) {
    $out['schools_columns'] = 'ERROR: ' . $e->getMessage();
}

// ── 6. Students table — columns ───────────────────────────
try {
    $cols = $pdo->query("SHOW COLUMNS FROM students")->fetchAll(PDO::FETCH_COLUMN);
    $out['students_columns'] = $cols;
} catch (Exception $e) {
    $out['students_columns'] = 'ERROR: ' . $e->getMessage();
}

// ── 7. All schools — slug + status ───────────────────────
try {
    $schools = $pdo->query("SELECT id, name, slug, status, plan FROM schools ORDER BY id")->fetchAll();
    $out['schools_in_db'] = $schools;
    $out['schools_count'] = count($schools);

    // Specific check for tenderminds-school
    $stmt = $pdo->prepare("SELECT id, name, slug, status FROM schools WHERE slug = ?");
    $stmt->execute(['tenderminds-school']);
    $found = $stmt->fetch();
    $out['tenderminds_school'] = $found ?: 'NOT FOUND in database';
} catch (Exception $e) {
    $out['schools_in_db'] = 'ERROR: ' . $e->getMessage();
}

// ── 8. Upload directory check ─────────────────────────────
$uploadBase = __DIR__ . '/../uploads';
$out['upload_dir_exists']     = is_dir($uploadBase);
$out['upload_dir_writable']   = is_writable($uploadBase);
$out['upload_logos_exists']   = is_dir($uploadBase . '/logos');
$out['upload_gallery_exists'] = is_dir($uploadBase . '/gallery');

// ── 9. .htaccess rewrite check ───────────────────────────
$out['htaccess_backend_exists'] = file_exists(__DIR__ . '/../.htaccess');
$out['htaccess_root_exists']    = file_exists(__DIR__ . '/../../.htaccess');

// ── 10. router.php exists ────────────────────────────────
$out['router_exists'] = file_exists(__DIR__ . '/router.php');

echo json_encode($out, JSON_PRETTY_PRINT);
