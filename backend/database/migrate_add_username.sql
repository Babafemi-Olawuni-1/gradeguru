-- ============================================================
-- MIGRATION: Add username column to users table
-- Run this once on your cPanel phpMyAdmin to enable teacher
-- username-based login.
-- ============================================================

ALTER TABLE users
  ADD COLUMN username VARCHAR(100) NULL DEFAULT NULL UNIQUE
  AFTER email;

-- Also add report_template to schools table if not present
ALTER TABLE schools
  ADD COLUMN IF NOT EXISTS report_template VARCHAR(50) NOT NULL DEFAULT 'classic'
  AFTER school_type;

-- Populate username for existing teachers (schoolslug_firstname.lastname)
UPDATE users u
JOIN schools s ON s.id = u.school_id
SET u.username = CONCAT(
    s.slug, '_',
    LOWER(REGEXP_REPLACE(u.first_name, '[^a-zA-Z0-9]', '')),
    '.',
    LOWER(REGEXP_REPLACE(u.last_name, '[^a-zA-Z0-9]', ''))
)
WHERE u.role = 'teacher' AND u.username IS NULL;
