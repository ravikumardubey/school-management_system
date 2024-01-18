BEGIN;
INSERT INTO public.drafts_table(user_id, draft_body, draft_images, draft_video, created_at, updated_at)
VALUES (${user_id}, ${draft_body}, ${draft_images}, ${draft_video}, Now(), Now());
COMMIT;
