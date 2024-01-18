BEGIN;
INSERT INTO PUBLIC.diary_entry(user_id, diary_body, diary_date, created_at, updated_at)
values (${user_id}, ${diary_body}, ${diary_date}, Now(), Now());

COMMIT;















