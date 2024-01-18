select id,role,encrypted_password,salt
from public.profile_user  where email = ${email} or phone_no like ('%' || ${phone_no}) AND deleted='0';