<?php
/**
 * POST /students/import
 * Bulk-import students from a CSV file.
 *
 * Expected CSV columns (header row required):
 *   first_name, last_name, admission_number, class_name, date_of_birth (optional)
 *
 * Returns: { success, imported, skipped, errors[] }
 */
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Method not allowed', 405);

$user   = getAuthUser(['school_admin']);
$school = requireSchool($user);

// ── Plan limit check (check total BEFORE import) ─────────
$limits   = PLAN_LIMITS[$school['plan']];
$existing = (int) fetchOne(
    'SELECT COUNT(*) as c FROM students WHERE school_id = ? AND is_active = 1',
    [$school['id']]
)['c'];

// ── File validation ────────────────────────────────────────
$file = $_FILES['csv'] ?? null;
if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    error('No CSV file uploaded or upload error', 400);
}

$ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
if ($ext !== 'csv') error('File must be a .csv file', 400);
if ($file['size'] > 2 * 1024 * 1024) error('CSV file too large (max 2MB)', 400);

// ── Parse CSV ──────────────────────────────────────────────
$handle = fopen($file['tmp_name'], 'r');
if (!$handle) error('Could not read uploaded file', 500);

// Read header row
$header = fgetcsv($handle);
if (!$header) { fclose($handle); error('CSV file is empty', 400); }

// Normalise header: trim, lowercase
$header = array_map(fn($h) => strtolower(trim($h)), $header);

$required = ['first_name', 'admission_number'];
foreach ($required as $col) {
    if (!in_array($col, $header)) {
        fclose($handle);
        error("CSV missing required column: $col", 400);
    }
}

// Column index map
$col = array_flip($header);

// Pre-load classes for this school (name => id lookup)
$classRows = fetchAll('SELECT id, name FROM classes WHERE school_id = ?', [$school['id']]);
$classMap  = [];
foreach ($classRows as $c) {
    $classMap[strtolower(trim($c['name']))] = $c['id'];
}

// ── Process rows ────────────────────────────────────────────
$imported = 0;
$skipped  = 0;
$rowErrors = [];
$rowNum   = 1; // header was row 0

while (($row = fgetcsv($handle)) !== false) {
    $rowNum++;
    if (count(array_filter($row, fn($v) => trim($v) !== '')) === 0) continue; // skip blank rows

    $firstName       = trim($row[$col['first_name']]        ?? '');
    $lastName        = trim($row[$col['last_name']]         ?? '');
    $admissionNumber = trim($row[$col['admission_number']]  ?? '');
    $className       = trim($row[$col['class_name']]        ?? '');
    $dateOfBirth     = trim($row[$col['date_of_birth']]     ?? '') ?: null;

    // Validate required fields
    if (!$firstName || !$admissionNumber) {
        $rowErrors[] = "Row $rowNum: first_name and admission_number are required";
        $skipped++;
        continue;
    }

    // Plan limit check per row
    if ($limits['students'] !== PHP_INT_MAX && ($existing + $imported) >= $limits['students']) {
        $rowErrors[] = "Row $rowNum: Student limit reached ({$limits['students']}). Remaining rows skipped.";
        $skipped += ($rowNum - 1 - $imported - $skipped); // count all remaining as skipped
        break;
    }

    // Resolve class_id
    $classId = null;
    if ($className !== '') {
        $classId = $classMap[strtolower($className)] ?? null;
        if ($classId === null) {
            // Auto-create the class if it doesn't exist
            try {
                $classId = insert(
                    'INSERT INTO classes (school_id, name) VALUES (?, ?)',
                    [$school['id'], $className]
                );
                $classMap[strtolower($className)] = $classId;
            } catch (Exception $e) {
                // Class likely created between check and insert — fetch it
                $found = fetchOne(
                    'SELECT id FROM classes WHERE school_id = ? AND name = ?',
                    [$school['id'], $className]
                );
                $classId = $found['id'] ?? null;
            }
        }
    }

    // Check for duplicate admission number
    if (fetchOne(
        'SELECT id FROM students WHERE school_id = ? AND admission_number = ?',
        [$school['id'], $admissionNumber]
    )) {
        $rowErrors[] = "Row $rowNum: Admission number '$admissionNumber' already exists — skipped";
        $skipped++;
        continue;
    }

    // Validate date_of_birth format if provided
    if ($dateOfBirth && !preg_match('/^\d{4}-\d{2}-\d{2}$/', $dateOfBirth)) {
        $dateOfBirth = null; // ignore invalid date rather than fail the row
    }

    try {
        insert(
            'INSERT INTO students (school_id, class_id, first_name, last_name, admission_number, date_of_birth)
             VALUES (?, ?, ?, ?, ?, ?)',
            [$school['id'], $classId, $firstName, $lastName, $admissionNumber, $dateOfBirth]
        );
        $imported++;
    } catch (Exception $e) {
        error_log("Student import row $rowNum failed: " . $e->getMessage());
        $rowErrors[] = "Row $rowNum: Insert failed — " . $e->getMessage();
        $skipped++;
    }
}

fclose($handle);

success([
    'imported' => $imported,
    'skipped'  => $skipped,
    'errors'   => $rowErrors,
], "$imported student" . ($imported !== 1 ? 's' : '') . " imported successfully" .
   ($skipped > 0 ? ", $skipped skipped" : ''));
