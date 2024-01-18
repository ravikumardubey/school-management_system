select *
from public.profile_user u,
     public.profile_student s
where s.college_name = ${college_name}
  and s.course = ${course}
  and s.semester = ${semester}
  and u.id = s.user_id;