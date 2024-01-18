BEGIN;
INSERT INTO public.table_resources(user_id, title, description, datetime, assigned_to, attached_files, university_name,
                                   college_name, created_at, updated_at, type)
VALUES (${user_id}, ${title}, ${description}, ${datetime}, ${assigned_to}, ${attached_files}, ${university_name},
        ${college_name}, Now(), Now(), ${type});
COMMIT;