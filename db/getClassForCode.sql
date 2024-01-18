select class.class_id,
       class.university_name,
       class.college_name,
       class.course,
       class.year,
       class.semester,
       class.batch,
       class.class_name,
       class.section,
       u.name,
       u.photo_url
from public.class_table class,
     public.profile_user u
where class.class_code = ${code}
  and class.user_id = u.id;