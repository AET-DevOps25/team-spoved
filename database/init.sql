CREATE SCHEMA IF NOT EXISTS db AUTHORIZATION "spOveD";

SET search_path TO db;

CREATE TYPE db.role AS ENUM ('SUPERVISOR', 'WORKER');

CREATE TYPE db.status AS ENUM ('FINISHED', 'IN_PROGRESS', 'OPEN');

CREATE TYPE db.media_type AS ENUM ('PHOTO', 'VIDEO', 'AUDIO');

CREATE TABLE IF NOT EXISTS db.users (
  user_id    SERIAL       PRIMARY KEY,
  name       VARCHAR(50)  NOT NULL,
  role       db.role      NOT NULL
);

CREATE TABLE IF NOT EXISTS db.media (
  media_id    SERIAL      PRIMARY KEY,
  content     BYTEA       NOT NULL,
  media_type  media_type  NOT NULL
);

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
  due_date    DATE            NOT NULL CHECK (due_date >= CURRENT_DATE),
  location    VARCHAR(50)     NOT NULL,
  media_type  db.media_type   NOT NULL DEFAULT 'PHOTO', 
  media_id    INTEGER
                    REFERENCES db.media(media_id)
                    ON DELETE RESTRICT
);

CREATE TABLE IF NOT EXISTS db.video_photo (
  media_id  INTEGER       PRIMARY KEY
                  REFERENCES db.media(media_id)
                  ON DELETE RESTRICT,

  analyzed  BOOLEAN       DEFAULT false,
  result    VARCHAR(500)  NOT NULL DEFAULT 'No result available',
  reason    VARCHAR(800)  NOT NULL DEFAULT 'No reasoning available'
);

ALTER TABLE db.tickets
ALTER COLUMN media_type TYPE VARCHAR;

ALTER TABLE db.tickets
ALTER COLUMN status TYPE VARCHAR;

INSERT INTO db.users (name, role)
VALUES
  ('Alice', 'SUPERVISOR'),   -- user_id = 1
  ('Bob', 'WORKER'),         -- user_id = 2
  ('Charlie', 'WORKER');     -- user_id = 3

INSERT INTO db.tickets (assigned_to, created_by, title, description, status, due_date, location, media_type)
VALUES
  (2, 1, 'Fix Login Bug', 'User unable to log in via web app', 'IN_PROGRESS', '2026-06-10', 'Berlin Office', 'PHOTO'), -- ticket_id = 1
  (3, 1, 'Database Migration', 'Move DB to cloud infrastructure', 'IN_PROGRESS', '2026-06-15', 'Remote', 'VIDEO');   -- ticket_id = 2
