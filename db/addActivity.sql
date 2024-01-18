BEGIN;
INSERT INTO public.table_activity (user_id, class_id, activity_type, question_type, title, description, total_questions,
                                   marks_detail, time_detail, visible_before_time, submit_after_time, public_visibility,
                                   questions, attached_files, datetime, created_at,
                                   updated_at, form_type)
VALUES (${user_id}, ${class_id}, ${activity_type}, ${question_type}, ${title}, ${description}, ${total_questions},
        ${marks_detail}, ${time_detail}, ${public_visibility}, ${visible_before_time}, ${submit_after_time},
        ${questions}, ${attached_files}, ${datetime}, Now(), Now(), ${form_type});
COMMIT;