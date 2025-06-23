-- Create the db schema
CREATE SCHEMA IF NOT EXISTS db AUTHORIZATION "spOveD";

-- Set the search path to the db schema
SET search_path TO db;

-- Create role enum
CREATE TYPE db.role AS ENUM ('SUPERVISOR', 'WORKER');

-- Create status enum
CREATE TYPE db.status AS ENUM ('FINISHED', 'IN_PROGRESS', 'OPEN');

-- Create media_type enum
CREATE TYPE db.media_type AS ENUM ('PHOTO', 'VIDEO', 'AUDIO');

-- Create users table
CREATE TABLE IF NOT EXISTS db.users (
  user_id       SERIAL       PRIMARY KEY,
  name          VARCHAR(50)  UNIQUE NOT NULL,
  role          db.role      NOT NULL,
  password_hash  VARCHAR(100) NOT NULL
);




-- Create tickets table
CREATE TABLE IF NOT EXISTS db.tickets (
  ticket_id   SERIAL          PRIMARY KEY,
  assigned_to INTEGER         
                   REFERENCES db.users(user_id)
                   ON DELETE RESTRICT,
  created_by  INTEGER         NOT NULL
                   REFERENCES db.users(user_id)
                   ON DELETE RESTRICT,
  title       VARCHAR(100)    NOT NULL DEFAULT 'New Ticket',
  description VARCHAR(500)    NOT NULL DEFAULT 'Description of the ticket',
  status      db.status       NOT NULL DEFAULT 'OPEN',
  due_date    DATE            NOT NULL CHECK (due_date >= CURRENT_DATE), -- Check if the introduced date is in the future
  location    VARCHAR(50)     NOT NULL,
  media_type  db.media_type   NOT NULL DEFAULT 'PHOTO' -- Default value if not specified
);

-- Change media_type to VARCHAR
ALTER TABLE db.tickets
ALTER COLUMN media_type TYPE VARCHAR;

-- Change status to VARCHAR
ALTER TABLE db.tickets
ALTER COLUMN status TYPE VARCHAR;


-- 1. Insert users without ticket references
INSERT INTO db.users (name, role, password_hash)
VALUES
  ('Alice', 'SUPERVISOR', 'hash1'),   -- user_id = 1
  ('Bob', 'WORKER', 'hash2'),         -- user_id = 2
  ('Charlie', 'WORKER', 'hash3');     -- user_id = 3

-- -- 2. Insert tickets (must use existing user_ids for assigned_to, created_by)
INSERT INTO db.tickets (assigned_to, created_by, title, description, status, due_date, location, media_type)
VALUES
  (2, 1, 'Fix Login Bug', 'User unable to log in via web app', 'IN_PROGRESS', '2025-08-10', 'Berlin Office', 'PHOTO'), -- ticket_id = 1
  (3, 1, 'Database Migration', 'Move DB to cloud infrastructure', 'IN_PROGRESS', '2025-08-15', 'Remote', 'VIDEO');   -- ticket_id = 2
