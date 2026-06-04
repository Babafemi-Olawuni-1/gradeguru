<?php
// Buffer all output so nothing leaks before our JSON
ob_start();

// Suppress any PHP warnings/notices from polluting JSON output
error_reporting(0);
ini_set('display_errors', 0);

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
  ob_end_clean();
  http_response_code(204);
  exit;
}

// Wrap everything — if anything dies unexpectedly, return JSON
register_shutdown_function(function() {
  $content = ob_get_clean();
  if (empty($content)) {
    echo json_encode(['success' => false, 'message' => 'Server produced no output']);
  } else {
    echo $content;
  }
});

// Parse the route from query string or PATH_INFO
$path = $_GET['route'] ?? '';
if (!$path) {
    // Try to extract from REQUEST_URI after router.php
    $uri  = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
    $uri  = preg_replace('#^.*/router\.php/?#', '', $uri);
    $path = trim($uri, '/');
}

// Also support ?route=auth/login style
$segments = array_filter(explode('/', $path));
$segments = array_values($segments);
$resource = $segments[0] ?? '';
$sub      = $segments[1] ?? '';
$key      = $sub ? "$resource/$sub" : $resource;

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
