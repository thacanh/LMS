-- LMS Microservices — MySQL Database Initialization
-- Creates all 5 service databases and a shared user

-- Create databases
CREATE DATABASE IF NOT EXISTS lms_auth CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS lms_courses CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS lms_lessons CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS lms_progress CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE DATABASE IF NOT EXISTS lms_quiz CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Create shared service user
CREATE USER IF NOT EXISTS 'lms_user'@'%' IDENTIFIED BY 'lms_password';

-- Grant permissions
GRANT ALL PRIVILEGES ON lms_auth.* TO 'lms_user'@'%';
GRANT ALL PRIVILEGES ON lms_courses.* TO 'lms_user'@'%';
GRANT ALL PRIVILEGES ON lms_lessons.* TO 'lms_user'@'%';
GRANT ALL PRIVILEGES ON lms_progress.* TO 'lms_user'@'%';
GRANT ALL PRIVILEGES ON lms_quiz.* TO 'lms_user'@'%';

FLUSH PRIVILEGES;
