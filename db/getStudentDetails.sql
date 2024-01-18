SELECT profile_user.*, profile_student.*
from public.profile_user,
     public.profile_student
where profile_user.id = ${user_id}
  and profile_user.id = profile_student.user_id;