BEGIN;
INSERT INTO public.table_user_classes(user_id, class_ids, created_at, updated_at, modify_ip, status)
VALUES (${user_id}, ${class_id}, Now(), Now(), ${ip}, ${status})
on conflict (user_id) do update SET class_ids = table_user_classes.class_ids || ${class_id}::jsonb
where public.table_user_classes.user_id = ${user_id};
COMMIT;