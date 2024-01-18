BEGIN;
INSERT INTO public.posts_table(user_id, posts_body, posts_video, posts_images, likes, comments, views, shares,
                               created_at, updated_at)
VALUES (${user_id}, ${post_body}, ${post_video}, ${post_images}, '0', '0', '0', '0', now(), now());
COMMIT;