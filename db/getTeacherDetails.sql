SELECT profile_user.*, profile_teacher.*
from public.profile_user,
     public.profile_teacher
where profile_user.id = ${user_id}
  and profile_user.id = profile_teacher.user_id;