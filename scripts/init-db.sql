-- ==============================================
-- LMS Microservices — MySQL Database Initialization
-- Creates one database per service (database-per-service pattern)
-- Run automatically by MySQL container on first start
-- ==============================================

CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS course_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS lesson_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS progress_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS quiz_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Grant all privileges to the lmsuser on each database
GRANT ALL PRIVILEGES ON auth_db.* TO 'lmsuser'@'%';
GRANT ALL PRIVILEGES ON course_db.* TO 'lmsuser'@'%';
GRANT ALL PRIVILEGES ON lesson_db.* TO 'lmsuser'@'%';
GRANT ALL PRIVILEGES ON progress_db.* TO 'lmsuser'@'%';
GRANT ALL PRIVILEGES ON quiz_db.* TO 'lmsuser'@'%';

FLUSH PRIVILEGES;
