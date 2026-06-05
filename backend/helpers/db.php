<?php
require_once __DIR__ . '/../config.php';

/**
 * Returns a singleton PDO connection to the cPanel MySQL database.
 * Credentials come entirely from config.php — no .env, no Supabase, no PostgreSQL.
 */
function db(): PDO {
    static $pdo = null;
    if ($pdo === null) {
        try {
            $pdo = new PDO(
                'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4',
                DB_USER,
                DB_PASS,
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            error_log('Database connection failed: ' . $e->getMessage());
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Database connection failed. Please try again later.']);
            exit;
        }
    }
    return $pdo;
}

/**
 * Verify the database connection is alive without exposing errors.
 * Use this for health checks — never for table creation.
 */
function checkDbConnection(): bool {
    try {
        db()->query('SELECT 1');
        return true;
    } catch (PDOException $e) {
        error_log('Database connection check failed: ' . $e->getMessage());
        return false;
    }
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
