<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

require_once __DIR__ . '/../helpers/db.php';
require_once __DIR__ . '/../../config.php';

$response = ['success' => false, 'message' => 'Invalid endpoint'];

// TEST DATABASE CONNECTION ENDPOINT
if (isset($_GET['action']) && $_GET['action'] === 'test-db') {
    try {
        $pdo = db();
        $stmt = $pdo->query("SELECT COUNT(*) as count FROM schools");
        $result = $stmt->fetch();
        
        $response = [
            'success' => true,
            'message' => 'Supabase connection successful!',
            'schools_count' => $result['count'],
            'database_type' => $pdo->getAttribute(PDO::ATTR_DRIVER_NAME)
        ];
    } catch (Exception $e) {
        $response = [
            'success' => false,
            'message' => 'Connection failed: ' . $e->getMessage()
        ];
    }
    echo json_encode($response);
    exit;
}

// HEALTH CHECK ENDPOINT
if (isset($_GET['action']) && $_GET['action'] === 'health') {
    $response = ['success' => true, 'message' => 'GradeGuru API is running', 'timestamp' => date('c')];
    echo json_encode($response);
    exit;
}

// SCHOOLS ENDPOINT (temporary mock data)
if (isset($_GET['action']) && $_GET['action'] === 'schools') {
    $response = ['success' => true, 'data' => [
        ['id' => 1, 'name' => 'Greenfield Academy', 'slug' => 'greenfield', 'plan' => 'pro'],
        ['id' => 2, 'name' => 'Sunrise Academy', 'slug' => 'sunrise', 'plan' => 'enterprise'],
        ['id' => 3, 'name' => 'Excel College', 'slug' => 'excel', 'plan' => 'starter']
    ]];
    echo json_encode($response);
    exit;
}

// If no action matched
echo json_encode($response);
?>