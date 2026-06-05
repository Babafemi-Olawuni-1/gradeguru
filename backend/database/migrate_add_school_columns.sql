-- ============================================================
-- MIGRATION: Add missing columns to schools table
-- Run this in cPanel phpMyAdmin if your schools table already
-- exists but is missing these columns.
-- Safe to run multiple times (IF NOT EXISTS checks).
-- ============================================================

ALTER TABLE schools
    ADD COLUMN IF NOT EXISTS about         TEXT         DEFAULT NULL          AFTER onboarded,
    ADD COLUMN IF NOT EXISTS founded_year  VARCHAR(10)  DEFAULT NULL          AFTER about,
    ADD COLUMN IF NOT EXISTS founder_name  VARCHAR(200) DEFAULT NULL          AFTER founded_year,
    ADD COLUMN IF NOT EXISTS motto         VARCHAR(300) DEFAULT NULL          AFTER founder_name,
    ADD COLUMN IF NOT EXISTS school_type   VARCHAR(100) DEFAULT NULL          AFTER motto,
    ADD COLUMN IF NOT EXISTS gallery       JSON         DEFAULT NULL          AFTER school_type;

-- ============================================================
-- MIGRATION: Add missing columns to students table
-- The students table may have been created with 'surname' and 'sex'
-- columns that are not in the canonical schema. Add standard columns.
-- ============================================================

ALTER TABLE students
    ADD COLUMN IF NOT EXISTS last_name  VARCHAR(100) NOT NULL DEFAULT '' AFTER first_name;

-- If your students table has 'surname' instead of 'last_name', run:
-- ALTER TABLE students CHANGE COLUMN surname last_name VARCHAR(100) NOT NULL DEFAULT '';

-- ============================================================
-- Verify schools table columns after migration:
-- ============================================================
-- SHOW COLUMNS FROM schools;
-- SHOW COLUMNS FROM students;
