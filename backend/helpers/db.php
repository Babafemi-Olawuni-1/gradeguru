<?php
require_once __DIR__ . '/../config.php';

// Load .env file for Supabase credentials (if config.php doesn't have them)
if (file_exists(__DIR__ . '/../.env')) {
    $lines = file(__DIR__ . '/../.env');
    foreach ($lines as $line) {
        $line = trim($line);
        if (strpos($line, '=') !== false && strpos($line, '#') !== 0) {
            list($key, $value) = explode('=', $line, 2);
            if (!defined($key)) {
                putenv("$key=$value");
            }
        }
    }
}

function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            // Check if we should use Supabase (PostgreSQL) or local MySQL
            $useSupabase = getenv('SUPABASE_DB_HOST') ? true : false;
            
            if ($useSupabase) {
                // Supabase PostgreSQL connection
                $host = getenv('SUPABASE_DB_HOST');
                $port = getenv('SUPABASE_DB_PORT') ?: '5432';
                $dbname = getenv('SUPABASE_DB_NAME') ?: 'postgres';
                $user = getenv('SUPABASE_DB_USER') ?: 'postgres';
                $password = getenv('SUPABASE_DB_PASSWORD') ?: '';
                
                $dsn = "pgsql:host=$host;port=$port;dbname=$dbname";
                $pdo = new PDO($dsn, $user, $password, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                ]);
            } else {
                // Local MySQL connection (for development)
                $pdo = new PDO(
                    'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                    DB_USER, DB_PASS,
                    [
                        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                        PDO::ATTR_EMULATE_PREPARES   => false,
                    ]
                );
            }
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database connection failed: ' . $e->getMessage()]);
            exit;
        }
    }
    return $pdo;
}

function query(string $sql, array $params = []): PDOStatement {
    $stmt = db()->prepare($sql);
    $stmt->execute($params);
    return $stmt;
}

function fetchOne(string $sql, array $params = []): ?array {
    $row = query($sql, $params)->fetch();
    return $row ?: null;
}

function fetchAll(string $sql, array $params = []): array {
    return query($sql, $params)->fetchAll();
}

function insert(string $sql, array $params = []): int {
    query($sql, $params);
    return (int) db()->lastInsertId();
}
?>