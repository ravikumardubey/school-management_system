select u.id, u.name, u.photo_url, m.*
from profile_user u,
     meetings_table m
where u.id = m.user_id