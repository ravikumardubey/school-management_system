select *
from public.profile_user
where email like ('%' || ${email} || '%');