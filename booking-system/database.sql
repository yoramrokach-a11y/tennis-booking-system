-- ==========================================
-- TENNIS COURT BOOKING SYSTEM DATABASE SCHEMA
-- Target Database: PostgreSQL 14+
-- ==========================================

-- Clean existing tables to allow safe schema re-runs (if needed in development)
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS courts CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Clean existing custom types
DROP TYPE IF EXISTS user_role CASCADE;

-- Create Roles Enum for system accounts
CREATE TYPE user_role AS ENUM ('PLAYER', 'STAFF', 'ADMIN');


-- 1. USERS TABLE
-- Manages customer accounts, administrator roles, and login credentials.
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role DEFAULT 'PLAYER'::user_role NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);


-- 2. COURTS TABLE
-- Contains physical tennis court assets (e.g. Grass courts, Clay courts, Indoor courts).
CREATE TABLE courts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT TRUE NOT NULL
);


-- 3. BOOKINGS TABLE
-- Handles the schedule bookings, binding players with designated courts, booking slots, and pricing details.
CREATE TABLE bookings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    court_id INTEGER NOT NULL,
    booking_date DATE NOT NULL,
    start_hour INTEGER NOT NULL, -- Format: 24h clock integer value (e.g., 9 for 09:00, 14 for 14:00)
    hours INTEGER NOT NULL,      -- Duration of the reservation in hours (typically 1, 2, or 3)
    price NUMERIC(10, 2) NOT NULL, -- Decimals representing transaction values
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,

    -- Constraints & Foreign Key Relations
    CONSTRAINT fk_booking_user 
        FOREIGN KEY (user_id) 
        REFERENCES users(id) 
        ON DELETE CASCADE,

    CONSTRAINT fk_booking_court 
        FOREIGN KEY (court_id) 
        REFERENCES courts(id) 
        ON DELETE RESTRICT,

    -- Enforce business boundary limit validations at database level
    CONSTRAINT check_booking_hours 
        CHECK (hours >= 1 AND hours <= 4),

    CONSTRAINT check_start_hour 
        CHECK (start_hour >= 6 AND start_hour <= 22) -- Operating hours: 06:00 to 22:00
);


-- ==========================================
-- INDEXING STRATEGIES (Performance Optimization)
-- ==========================================

-- Index on user emails for ultra-fast login and password authorization queries.
CREATE INDEX idx_users_email ON users(email);

-- Index on bookings foreign keys to boost sub-query table joins.
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_court_id ON bookings(court_id);

-- Composite Index on court booking schedules. High-speed lookup for search filters and overlaps.
CREATE INDEX idx_bookings_schedule ON bookings(court_id, booking_date, start_hour);


-- ==========================================
-- SAMPLE SEED DATA
-- ==========================================

-- Seeding Users (Password hashes pre-generated using bcrypt for testing: 'password123')
INSERT INTO users (name, email, password_hash, role) VALUES
('John Doe', 'john.doe@example.com', '$2b$12$K33Kj2gG4O.r.Sg.UoVpQO987Lz9m9kC4U5j1gH7gLz3D.jG1D1qW', 'PLAYER'),
('Sarah Williams', 'sarah.w@example.com', '$2b$12$K33Kj2gG4O.r.Sg.UoVpQO987Lz9m9kC4U5j1gH7gLz3D.jG1D1qW', 'PLAYER'),
('Admin Coach David', 'coach.david@example.com', '$2b$12$K33Kj2gG4O.r.Sg.UoVpQO987Lz9m9kC4U5j1gH7gLz3D.jG1D1qW', 'ADMIN');

-- Seeding Courts
INSERT INTO courts (name, is_active) VALUES
('Centre Court (Grass)', true),
('Court 1 (Clay)', true),
('Court 2 (Hard)', true),
('Court 3 (Grass - Maintenance)', false);

-- Seeding Sample Bookings
-- John Doe (user_id 1) books Centre Court (court_id 1) for a 2-hour match at 10:00 AM
INSERT INTO bookings (user_id, court_id, booking_date, start_hour, hours, price) VALUES
(1, 1, CURRENT_DATE, 10, 2, 70.00),
(2, 2, CURRENT_DATE, 14, 1, 25.00),
(1, 3, CURRENT_DATE + INTERVAL '1 day', 16, 2, 50.00);
