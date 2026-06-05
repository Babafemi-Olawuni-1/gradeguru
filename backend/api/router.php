<?php
ini_set('display_errors', 0);
ini_set('display_startup_errors', 0);
error_reporting(0);
ini_set('log_errors', 1);

// Start output buffer FIRST so nothing leaks before headers
if (!ob_get_level()) ob_start();

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: https://gradeguru.atayesefm.com.ng');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

// Handle CORS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    ob_end_clean();
    http_response_code(204);
    exit;
}

// Safety net: catch any fatal error / unexpected exit and return valid JSON
register_shutdown_function(function () {
    $err = error_get_last();
    // Only intercept real fatal errors, not normal exits
    if ($err && in_array($err['type'], [E_ERROR, E_PARSE, E_CORE_ERROR, E_COMPILE_ERROR])) {
        // Discard any partial output
        while (ob_get_level()) ob_end_clean();
        http_response_code(500);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode([
            'success' => false,
            'message' => 'Server error — please try again.',
            // Uncomment for debugging only:
            // '_debug' => $err['message'] . ' in ' . $err['file'] . ':' . $err['line'],
        ]);
        return;
    }

    // Normal exit — flush buffered output
    $content = ob_get_clean();
    if (!headers_sent()) {
        header('Content-Type: application/json; charset=utf-8');
    }
    if ($content !== false && $content !== '') {
        echo $content;
    } else {
        echo json_encode(['success' => false, 'message' => 'Server produced no output']);
    }
});

// ── Route resolution ──────────────────────────────────────
// Priority 1: ?route=auth/login
$path = $_GET['route'] ?? '';

// Priority 2: ?action=auth/login (legacy .htaccess style)
if (!$path && isset($_GET['action'])) {
    $path = $_GET['action'];
}

// Priority 3: extract from REQUEST_URI path after /api/
if (!$path) {
    $uri  = parse_url($_SERVER['REQUEST_URI'] ?? '', PHP_URL_PATH);
    $uri  = preg_replace('#^.*?/api/?#', '', $uri ?? '');
    $path = trim($uri, '/');
}

$segments = array_values(array_filter(explode('/', $path)));
$resource = $segments[0] ?? '';
$sub      = $segments[1] ?? '';
// Only use two-segment key if second segment is a known sub-resource (not a numeric ID)
$key      = ($sub && !is_numeric($sub)) ? "$resource/$sub" : $resource;

$routes = [
    'auth/register'   => __DIR__ . '/auth/register.php',
    'auth/login'      => __DIR__ . '/auth/login.php',
    'auth/logout'     => __DIR__ . '/auth/logout.php',
    'school'          => __DIR__ . '/school/index.php',
    'school/public'   => __DIR__ . '/school/public.php',
    'school/upload'   => __DIR__ . '/school/upload.php',
    'students'        => __DIR__ . '/students/index.php',
    'teachers'        => __DIR__ . '/teachers/index.php',
    'classes'         => __DIR__ . '/classes/index.php',
    'subjects'        => __DIR__ . '/subjects/index.php',
    'class_subjects'  => __DIR__ . '/class_subjects/index.php',
    'results'         => __DIR__ . '/results/index.php',
    'pins'            => __DIR__ . '/pins/index.php',
    'pins/check'      => __DIR__ . '/pins/check.php',
    'wallet'          => __DIR__ . '/wallet/index.php',
    'wallet/verify'   => __DIR__ . '/wallet/verify.php',
    'announcements'   => __DIR__ . '/announcements/index.php',
    'super'           => __DIR__ . '/super/index.php',
];

if (isset($routes[$key]) && file_exists($routes[$key])) {
    require $routes[$key];
} else {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => "Endpoint not found: '$key'"]);
}
