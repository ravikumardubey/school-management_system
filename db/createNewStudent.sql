BEGIN;
INSERT INTO public.profile_student(user_id, university_name, college_name, roll_no, course, batch, city_name, semester,
                                   created_at, updated_at)
VALUES (${user_id}, ${university_name}, ${college_name}, ${roll_no}, ${course_name}, ${batch}, ${city}, ${semester},
        Now(), Now());
COMMIT;