BEGIN;
INSERT INTO public.table_notifications_educational(user_id, title, body, datetime, created_at,
                                                   updated_at, university_name, college_name, department_name, class_id,
                                                   type, link)
VALUES (${user_id}, ${title}, ${body}, ${datetime}, Now(),
        Now(), ${university_name}, ${college_name}, ${department_name}, ${class_id}, ${type}, ${link});
COMMIT;