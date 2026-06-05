<?php
ini_set('display_errors', 0);
error_reporting(0);

require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';
require_once __DIR__ . '/../../middleware/auth.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') error('Method not allowed', 405);

$user   = getAuthUser(['school_admin']);
$school = requireSchool($user);

$type = $_POST['type'] ?? 'logo';
$file = $_FILES['file'] ?? null;

if (!$file || $file['error'] !== UPLOAD_ERR_OK) {
    $errMsg = [
        UPLOAD_ERR_INI_SIZE   => 'File too large (server limit)',
        UPLOAD_ERR_FORM_SIZE  => 'File too large (form limit)',
        UPLOAD_ERR_PARTIAL    => 'File only partially uploaded',
        UPLOAD_ERR_NO_FILE    => 'No file uploaded',
        UPLOAD_ERR_NO_TMP_DIR => 'Missing temp folder',
        UPLOAD_ERR_CANT_WRITE => 'Failed to write file',
    ];
    $code = $file['error'] ?? UPLOAD_ERR_NO_FILE;
    error($errMsg[$code] ?? 'Upload error code: ' . $code, 400);
}

// Validate MIME type
$allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
$mime    = mime_content_type($file['tmp_name']);
if (!in_array($mime, $allowed)) {
    error('Only JPG, PNG, GIF, and WebP images are allowed. Got: ' . $mime, 400);
}

// Size limits
$maxSize = ($type === 'logo') ? 2 * 1024 * 1024 : 5 * 1024 * 1024;
if ($file['size'] > $maxSize) {
    error('File too large. Max ' . ($type === 'logo' ? '2MB' : '5MB') . '. Got: ' . round($file['size'] / 1024) . 'KB', 400);
}

// Extension from MIME
$mimeToExt = ['image/jpeg' => 'jpg', 'image/png' => 'png', 'image/gif' => 'gif', 'image/webp' => 'webp'];
$ext       = $mimeToExt[$mime] ?? 'jpg';

// Sanitise slug for use in filename
$safeSlug  = preg_replace('/[^a-z0-9\-]/', '', $school['slug']);
$filename  = $safeSlug . '_' . uniqid() . '.' . $ext;
$subdir    = ($type === 'logo') ? 'logos' : 'gallery';

// Use UPLOAD_DIR constant defined in config.php (__DIR__/../../uploads/)
$dir  = rtrim(UPLOAD_DIR, '/') . '/' . $subdir . '/';
if (!is_dir($dir)) mkdir($dir, 0755, true);

$dest = $dir . $filename;
if (!move_uploaded_file($file['tmp_name'], $dest)) {
    error_log('Upload failed: could not move to ' . $dest);
    error('Failed to save file to disk. Check folder permissions.', 500);
}

// Store as a web-accessible path relative to the backend uploads folder
$url = '/backend/uploads/' . $subdir . '/' . $filename;

// If logo, update school record immediately
if ($type === 'logo') {
    query('UPDATE schools SET logo_url = ? WHERE id = ?', [$url, $school['id']]);
}

success(['url' => $url, 'filename' => $filename], 'File uploaded successfully');
