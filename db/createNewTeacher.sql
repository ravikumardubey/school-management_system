BEGIN;
INSERT INTO public.profile_teacher(user_id, university_name, college_name, employee_id, teacher_rank, subject_expertise,
                                   created_at, updated_at)
VALUES (${user_id}, ${university_name}, ${college_name}, ${employee_id}, ${teacher_rank}, ${subject_expertise}, NOW(),
        NOW());
COMMIT;