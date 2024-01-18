BEGIN;
UPDATE public.profile_student
SET university_name = ${university_name},
    college_name    = ${college_name},
    roll_no         = ${roll_no},
    course          = ${course_name},
    batch           = ${batch},
    semester        = ${semester},
    updated_at      = Now()
WHERE profile_student.user_id = ${user_id};
COMMIT;