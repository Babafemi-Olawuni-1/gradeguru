<?php
// This file is kept for direct access only.
// All API routing goes through router.php via .htaccess.

ob_start();
error_reporting(0);
ini_set('display_errors', 0);

header('Access-Control-Allow-Origin: https://gradeguru.atayesefm.com.ng');
header('Content-Type: application/json');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Credentials: true');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Forward to router
$_GET['route'] = $_GET['action'] ?? '';
require_once __DIR__ . '/router.php';
