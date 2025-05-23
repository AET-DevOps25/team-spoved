CREATE EXTENSION IF NOT EXISTS pgtap;

SELECT plan(7);

-- 1. Can insert valid users
SELECT ok(
  (INSERT INTO db.users (name, supervisor) VALUES ('X', 'WORKER') RETURNING TRUE),
  'Insert WORKER user succeeds'
);

-- 2. Invalid enum fails
SELECT throws_ok(
  $$INSERT INTO db.tickets (assigned_to, created_by, due_date, location, media_type)
    VALUES (1,1,'2025-07-01','Z','INVALID')$$,
  'invalid input value for enum',
  'Reject bad media_type enum'
);

-- 3. RESTRICT on delete
-- Create fixture
INSERT INTO db.users (name, supervisor) VALUES ('Y','WORKER') RETURNING user_id INTO STRICT _uid;
INSERT INTO db.tickets (assigned_to, created_by, due_date, location, media_type)
  VALUES (_uid,_uid,'2025-07-02','X','AUDIO') RETURNING ticket_id INTO STRICT _tid;

SELECT throws_ok(
  $$DELETE FROM db.users WHERE user_id = $$ || _uid,
  'violates foreign key constraint',
  'Cannot delete user with assigned ticket'
);

-- 4. SET NULL on ticket delete
DELETE FROM db.tickets WHERE ticket_id = _tid;
SELECT is(
  (SELECT ticket_id IS NULL FROM db.users WHERE user_id = _uid),
  TRUE,
  'ticket_id set to NULL on ticket deletion'
);

SELECT * FROM finish();
