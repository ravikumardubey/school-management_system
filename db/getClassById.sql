select class.*, u.photo_url, u.name, u.id
from public.class_table class, public.profile_user u
where class.class_id = ${class_id} and class.user_id = u.id;