select s.*, u.photo_url, u.name
from public.table_activity_submission s,
     profile_user u
where activity_id = ${activity_id}
  and class_id = ${class_id}
  and s.user_id = u.id;