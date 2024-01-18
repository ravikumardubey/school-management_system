BEGIN;
INSERT INTO public.profile_student(user_id, university_name, college_name, roll_no, course, batch, city_name, semester,
                                   created_at, updated_at, year)
VALUES (${user_id}, ${university_name}, ${college_name}, ${roll_no}, ${course_name}, ${batch}, ${city}, ${semester},
        Now(), Now())
on conflict (user_id) do update SET university_name=${university_name},
                                    college_name=${college_name},
                                    roll_no=${roll_no},
                                    course=${course_name},
                                    batch=${batch},
                                    city_name=${city},
                                    semester=${semester},
                                    updated_at=now(),
                                    year=${year}
where profile_student.user_id = ${user_id};
COMMIT;