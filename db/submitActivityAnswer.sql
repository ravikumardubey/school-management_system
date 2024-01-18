BEGIN;
INSERT INTO public.table_activity_submission(activity_id, user_id, class_id, answers, datetime, created_at, updated_at)
VALUES (${activity_id}, ${userId}, ${class_id}, ${answers}, ${datetime}, now(), now());
COMMIT;