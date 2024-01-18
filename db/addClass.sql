INSERT INTO public.class_table(user_id, university_name, college_name, course, year, semester, batch,
                               class_name, class_description, class_strength, teachers_list, students_list, created_at,
                               updated_at, section, class_code)
VALUES (${user_id}, ${university_name}, ${college_name}, ${course}, ${year}, ${semester}, ${batch},
        ${class_name}, ${class_description}, ${class_strength}, ${teachers_list}, ${students_list}, Now(), Now(),
        ${section}, ${code})
returning class_id;