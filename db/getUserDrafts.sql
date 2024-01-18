select u.id, u.photo_url, u.name, d.*
from profile_user u,
     drafts_table d
where d.user_id = ${user_id}
  and d.user_id = u.id;