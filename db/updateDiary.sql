BEGIN;
UPDATE PUBLIC.diary_entry
SET diary_body = ${diary_body},
    updated_at = Now()
WHERE user_id = ${user_id}
  and diary_date = ${diary_date};

COMMIT;