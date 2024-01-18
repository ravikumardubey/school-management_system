select class.class_id,
       class.user_id,
       class.university_name,
       class.college_name,
       class.course,
       class.year,
       class.semester,
       class.batch,
       class.class_name,
       class.class_description,
       class.class_strength,
       class.teachers_list,
       class.students_list,
       class.created_at,
       class.section,
       class.class_code,
       u.name,
       u.photo_url
from public.class_table class,
     public.profile_user u
where class.university_name = ${university_name}
  and class.college_name = ${college_name}
  and class.user_id = u.id;