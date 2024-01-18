BEGIN;
INSERT INTO public.profile_teacher(user_id, university_name, college_name, employee_id, teacher_rank, subject_expertise,
                                   created_at, updated_at)
VALUES (${user_id}, ${university_name}, ${college_name}, ${employee_id}, ${teacher_rank}, ${subject_expertise}, NOW(),
        NOW())
on conflict (user_id) do update SET university_name=${university_name},
                                    updated_at=now(),
                                    college_name=${college_name},
                                    employee_id=${employee_id},
                                    teacher_rank=${teacher_rank},
                                    subject_expertise=${subject_expertise}
where profile_teacher.user_id = ${user_id};
COMMIT;