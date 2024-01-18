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
     public.profile_user u,
     public.table_user_classes p,
     jsonb_to_recordset(p.class_ids) as class_ids(id integer)
where p.user_id = ${user_id}
  and class_ids.id = class.class_id
  and class.user_id = u.id;
