SELECT profile_user.name, profile_user.id, profile_user.role, profile_student.*
from public.profile_user,
     public.profile_student
where profile_user.id = ${sUserId}
  and profile_student.user_id = profile_user.id;