-- ============================================================
-- GRADEGURU DATABASE SCHEMA
-- Import this into: atayesef_gradeguru (already exists on cPanel)
-- DO NOT run CREATE DATABASE — the database already exists.
-- Import via cPanel phpMyAdmin: select atayesef_gradeguru, then Import this file.
-- ============================================================

-- ============================================================
-- SCHOOLS
-- ============================================================
CREATE TABLE schools (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name            VARCHAR(200) NOT NULL,
  slug            VARCHAR(60)  NOT NULL UNIQUE,
  email           VARCHAR(200) NOT NULL UNIQUE,
  logo_url        VARCHAR(500) DEFAULT NULL,
  welcome_text    TEXT         DEFAULT NULL,
  phone           VARCHAR(30)  DEFAULT NULL,
  address         TEXT         DEFAULT NULL,
  primary_color   VARCHAR(10)  DEFAULT '#7c3aed',
  status          ENUM('pending','active','suspended') NOT NULL DEFAULT 'pending',
  plan            ENUM('starter','pro','enterprise')   NOT NULL DEFAULT 'starter',
  plan_expires_at DATETIME     DEFAULT NULL,
  wallet_balance  DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  onboarded       TINYINT(1)   NOT NULL DEFAULT 0,
  -- Extended profile fields
  about           TEXT         DEFAULT NULL,
  founded_year    VARCHAR(10)  DEFAULT NULL,
  founder_name    VARCHAR(200) DEFAULT NULL,
  motto           VARCHAR(300) DEFAULT NULL,
  school_type     VARCHAR(100) DEFAULT NULL,
  gallery         JSON         DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ============================================================
-- USERS  (super_admin | school_admin | teacher)
-- ============================================================
CREATE TABLE users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id       INT UNSIGNED DEFAULT NULL,          -- NULL for super_admin
  role            ENUM('super_admin','school_admin','teacher') NOT NULL,
  first_name      VARCHAR(100) NOT NULL,
  last_name       VARCHAR(100) NOT NULL,
  email           VARCHAR(200) NOT NULL UNIQUE,
  password_hash   VARCHAR(255) NOT NULL,
  is_active       TINYINT(1)   NOT NULL DEFAULT 1,
  failed_logins   TINYINT      NOT NULL DEFAULT 0,
  locked_until    DATETIME     DEFAULT NULL,
  last_login_at   DATETIME     DEFAULT NULL,
  created_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SESSIONS / TOKENS
-- ============================================================
CREATE TABLE auth_tokens (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED NOT NULL,
  token       VARCHAR(255) NOT NULL UNIQUE,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- ACADEMIC SESSIONS & TERMS
-- ============================================================
CREATE TABLE academic_sessions (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id  INT UNSIGNED NOT NULL,
  name       VARCHAR(50)  NOT NULL,   -- e.g. 2024/2025
  is_current TINYINT(1)   NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE terms (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  session_id  INT UNSIGNED NOT NULL,
  school_id   INT UNSIGNED NOT NULL,
  name        ENUM('First Term','Second Term','Third Term') NOT NULL,
  is_current  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES academic_sessions(id) ON DELETE CASCADE,
  FOREIGN KEY (school_id)  REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- CLASSES & SUBJECTS
-- ============================================================
CREATE TABLE classes (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   INT UNSIGNED NOT NULL,
  name        VARCHAR(100) NOT NULL,   -- e.g. JSS1, SSS2A
  description VARCHAR(255) DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY uq_class (school_id, name)
) ENGINE=InnoDB;

CREATE TABLE subjects (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id  INT UNSIGNED NOT NULL,
  name       VARCHAR(150) NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY uq_subject (school_id, name)
) ENGINE=InnoDB;

-- class <-> subject mapping
CREATE TABLE class_subjects (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  class_id   INT UNSIGNED NOT NULL,
  subject_id INT UNSIGNED NOT NULL,
  FOREIGN KEY (class_id)   REFERENCES classes(id)  ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE KEY uq_cs (class_id, subject_id)
) ENGINE=InnoDB;

-- teacher <-> class+subject assignment
CREATE TABLE teacher_assignments (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  teacher_id       INT UNSIGNED NOT NULL,
  class_subject_id INT UNSIGNED NOT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id)       REFERENCES users(id)          ON DELETE CASCADE,
  FOREIGN KEY (class_subject_id) REFERENCES class_subjects(id) ON DELETE CASCADE,
  UNIQUE KEY uq_ta (teacher_id, class_subject_id)
) ENGINE=InnoDB;

-- ============================================================
-- STUDENTS
-- ============================================================
CREATE TABLE students (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id        INT UNSIGNED NOT NULL,
  class_id         INT UNSIGNED DEFAULT NULL,
  first_name       VARCHAR(100) NOT NULL,
  last_name        VARCHAR(100) NOT NULL,
  admission_number VARCHAR(100) NOT NULL,
  date_of_birth    DATE         DEFAULT NULL,
  photo_url        VARCHAR(500) DEFAULT NULL,
  is_active        TINYINT(1)   NOT NULL DEFAULT 1,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id)  REFERENCES classes(id) ON DELETE SET NULL,
  UNIQUE KEY uq_admission (school_id, admission_number)
) ENGINE=InnoDB;

-- ============================================================
-- RESULT TEMPLATES
-- ============================================================
CREATE TABLE result_templates (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id    INT UNSIGNED NOT NULL,
  name         VARCHAR(100) NOT NULL DEFAULT 'Default',
  ca1_label    VARCHAR(50)  NOT NULL DEFAULT 'CA1',
  ca1_max      TINYINT      NOT NULL DEFAULT 20,
  ca2_label    VARCHAR(50)  NOT NULL DEFAULT 'CA2',
  ca2_max      TINYINT      NOT NULL DEFAULT 20,
  exam_label   VARCHAR(50)  NOT NULL DEFAULT 'Exam',
  exam_max     TINYINT      NOT NULL DEFAULT 60,
  grading_json JSON         NOT NULL,   -- [{min,max,grade,remark}]
  is_active    TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- RESULTS
-- ============================================================
CREATE TABLE results (
  id               INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id        INT UNSIGNED NOT NULL,
  student_id       INT UNSIGNED NOT NULL,
  class_id         INT UNSIGNED NOT NULL,
  subject_id       INT UNSIGNED NOT NULL,
  term_id          INT UNSIGNED NOT NULL,
  teacher_id       INT UNSIGNED DEFAULT NULL,
  ca1              DECIMAL(5,2) DEFAULT 0,
  ca2              DECIMAL(5,2) DEFAULT 0,
  exam             DECIMAL(5,2) DEFAULT 0,
  total            DECIMAL(5,2) GENERATED ALWAYS AS (ca1 + ca2 + exam) STORED,
  grade            VARCHAR(5)   DEFAULT NULL,
  remark           VARCHAR(100) DEFAULT NULL,
  is_published     TINYINT(1)   NOT NULL DEFAULT 0,
  published_at     DATETIME     DEFAULT NULL,
  created_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id)  REFERENCES schools(id)   ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id)  ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES classes(id)   ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id)  ON DELETE CASCADE,
  FOREIGN KEY (term_id)    REFERENCES terms(id)      ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id)      ON DELETE SET NULL,
  UNIQUE KEY uq_result (student_id, subject_id, term_id)
) ENGINE=InnoDB;

-- ============================================================
-- PINS
-- ============================================================
CREATE TABLE pins (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   INT UNSIGNED NOT NULL,
  class_id    INT UNSIGNED DEFAULT NULL,
  term_id     INT UNSIGNED DEFAULT NULL,
  student_id  INT UNSIGNED DEFAULT NULL,
  pin_code    VARCHAR(20)  NOT NULL UNIQUE,
  status      ENUM('unused','used','expired') NOT NULL DEFAULT 'unused',
  cost        DECIMAL(8,2) NOT NULL DEFAULT 0,
  used_at     DATETIME     DEFAULT NULL,
  expires_at  DATETIME     NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id)  REFERENCES schools(id)   ON DELETE CASCADE,
  FOREIGN KEY (class_id)   REFERENCES classes(id)   ON DELETE SET NULL,
  FOREIGN KEY (term_id)    REFERENCES terms(id)      ON DELETE SET NULL,
  FOREIGN KEY (student_id) REFERENCES students(id)  ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- TRANSACTIONS (wallet)
-- ============================================================
CREATE TABLE transactions (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id       INT UNSIGNED NOT NULL,
  type            ENUM('topup','pin_purchase','subscription','addon','adjustment') NOT NULL,
  amount          DECIMAL(12,2) NOT NULL,
  balance_before  DECIMAL(12,2) NOT NULL,
  balance_after   DECIMAL(12,2) NOT NULL,
  reference       VARCHAR(100)  DEFAULT NULL,
  gateway         VARCHAR(50)   DEFAULT NULL,
  description     TEXT          DEFAULT NULL,
  status          ENUM('pending','success','failed') NOT NULL DEFAULT 'success',
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- SUBSCRIPTIONS
-- ============================================================
CREATE TABLE subscriptions (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id    INT UNSIGNED NOT NULL,
  plan         ENUM('starter','pro','enterprise') NOT NULL,
  billing      ENUM('monthly','annual') NOT NULL DEFAULT 'monthly',
  amount       DECIMAL(10,2) NOT NULL DEFAULT 0,
  starts_at    DATETIME      NOT NULL,
  expires_at   DATETIME      NOT NULL,
  reference    VARCHAR(100)  DEFAULT NULL,
  status       ENUM('active','expired','cancelled') NOT NULL DEFAULT 'active',
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- ANNOUNCEMENTS
-- ============================================================
CREATE TABLE announcements (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id    INT UNSIGNED NOT NULL,
  title        VARCHAR(255) NOT NULL,
  body         TEXT         NOT NULL,
  publish_at   DATETIME     DEFAULT NULL,
  is_published TINYINT(1)   NOT NULL DEFAULT 1,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- AI LESSON NOTES
-- ============================================================
CREATE TABLE lesson_notes (
  id         INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id  INT UNSIGNED NOT NULL,
  teacher_id INT UNSIGNED NOT NULL,
  topic      VARCHAR(255) NOT NULL,
  class_level VARCHAR(100) NOT NULL,
  content    LONGTEXT     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id)  REFERENCES schools(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES users(id)   ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- ID CARDS
-- ============================================================
CREATE TABLE id_cards (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   INT UNSIGNED NOT NULL,
  student_id  INT UNSIGNED NOT NULL,
  template    VARCHAR(50)  NOT NULL DEFAULT 'default',
  file_url    VARCHAR(500) DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (school_id)  REFERENCES schools(id)  ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ============================================================
-- USAGE TRACKING (monthly limits)
-- ============================================================
CREATE TABLE usage_tracking (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  school_id   INT UNSIGNED NOT NULL,
  month       CHAR(7)      NOT NULL,   -- e.g. 2025-01
  id_cards    INT          NOT NULL DEFAULT 0,
  lesson_notes INT         NOT NULL DEFAULT 0,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE,
  UNIQUE KEY uq_usage (school_id, month)
) ENGINE=InnoDB;

-- ============================================================
-- SYSTEM LOGS
-- ============================================================
CREATE TABLE system_logs (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     INT UNSIGNED DEFAULT NULL,
  school_id   INT UNSIGNED DEFAULT NULL,
  action      VARCHAR(100) NOT NULL,
  description TEXT         DEFAULT NULL,
  ip_address  VARCHAR(45)  DEFAULT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id)   REFERENCES users(id)   ON DELETE SET NULL,
  FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ============================================================
-- PLATFORM SETTINGS
-- ============================================================
CREATE TABLE platform_settings (
  id           INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  setting_key  VARCHAR(100) NOT NULL UNIQUE,
  setting_value TEXT        NOT NULL,
  updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

INSERT INTO platform_settings (setting_key, setting_value) VALUES
  ('pin_expiry_days',        '365'),
  ('pin_price_starter',      '100'),
  ('pin_price_pro',          '80'),
  ('pin_price_enterprise',   '50'),
  ('require_school_approval','0'),
  ('pro_price_monthly',      '10000'),
  ('pro_price_annual',       '96000'),
  ('enterprise_price_monthly','30000'),
  ('enterprise_price_annual', '288000');

-- ============================================================
-- DEFAULT SUPER ADMIN
-- password: Admin@1234  (bcrypt hash)
-- ============================================================
INSERT INTO users (school_id, role, first_name, last_name, email, password_hash) VALUES
  (NULL, 'super_admin', 'Super', 'Admin', 'admin@gradeguru.com',
   '$2y$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uHV/WRe6W');
