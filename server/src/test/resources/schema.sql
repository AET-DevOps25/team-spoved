CREATE SCHEMA IF NOT EXISTS db;
SET search_path TO db;

CREATE TYPE db.role AS ENUM ('SUPERVISOR', 'WORKER');
CREATE TYPE db.status AS ENUM ('FINISHED', 'IN PROGRESS');
CREATE TYPE db.media_type AS ENUM ('PHOTO', 'VIDEO', 'AUDIO');

CREATE TABLE IF NOT EXISTS db.users (
  user_id    SERIAL    PRIMARY KEY,
  name       VARCHAR(50) NOT NULL,
  supervisor db.role   NOT NULL
);

CREATE TABLE IF NOT EXISTS db.tickets (
  ticket_id   SERIAL          PRIMARY KEY,
  assigned_to INTEGER         NOT NULL
                   REFERENCES db.users(user_id)
                   ON DELETE RESTRICT,
  created_by  INTEGER         NOT NULL
                   REFERENCES db.users(user_id)
                   ON DELETE RESTRICT,
  title       VARCHAR(100)    NOT NULL DEFAULT 'New Ticket',
  description VARCHAR(500)    NOT NULL DEFAULT 'Description of the ticket',
  status      db.status       NOT NULL DEFAULT 'IN PROGRESS',
  due_date    DATE            NOT NULL,
  location    VARCHAR(50)     NOT NULL,
  media_type  db.media_type   NOT NULL
);

ALTER TABLE db.users
  ADD COLUMN ticket_id INTEGER;

ALTER TABLE db.users
  ADD CONSTRAINT fk_users_ticket
    FOREIGN KEY (ticket_id)
    REFERENCES db.tickets(ticket_id)
    ON DELETE SET NULL;