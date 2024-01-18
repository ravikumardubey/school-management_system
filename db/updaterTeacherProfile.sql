BEGIN;
UPDATE public.profile_teacher
SET university_name   = ${university_name},
    college_name      = ${college_name},
    employee_id       = ${employee_id},
    teacher_rank      = ${teacher_rank},
    subject_expertise = ${subject_expertise},
    updated_at        = Now()
WHERE profile_teacher.user_id = ${user_id};
COMMIT;