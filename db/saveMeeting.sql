BEGIN;
INSERT INTO public.meetings_table(user_id, title, description, level, created_at, updated_at)
VALUES (${user_id}, ${title}, ${description}, ${level}, Now(), Now());
COMMIT;
