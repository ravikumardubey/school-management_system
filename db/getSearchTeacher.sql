SELECT profile_user.name, profile_user.id, profile_user.role, profile_teacher.*
from public.profile_user,
     public.profile_teacher
where profile_user.id = ${tUserId}
  and profile_user.id = profile_teacher.user_id;