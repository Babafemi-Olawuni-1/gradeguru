<?php
// Public — no auth required
require_once __DIR__ . '/../../helpers/db.php';
require_once __DIR__ . '/../../helpers/response.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') error('Method not allowed', 405);

$slug = strtolower(trim($_GET['slug'] ?? ''));
if (!$slug) error('Slug is required', 400);

$school = fetchOne(
    "SELECT id, name, slug, logo_url, welcome_text, phone, email, address,
            primary_color, plan, about, founded_year, founder_name, motto, school_type, gallery
     FROM schools WHERE slug = ? AND status = 'active'",
    [$slug]
);
if (!$school) error('School not found', 404);

$announcements = fetchAll(
    "SELECT title, body, created_at FROM announcements
     WHERE school_id = ? AND is_published = 1
     AND (publish_at IS NULL OR publish_at <= NOW())
     ORDER BY created_at DESC LIMIT 10",
    [$school['id']]
);

success(['school' => $school, 'announcements' => $announcements]);
