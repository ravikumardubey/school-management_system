select *
from public.profile_user
where phone_no like ('%' || ${phone_no} || '%');