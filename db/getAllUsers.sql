select u.id, u.photo_url, u.name, u.role
from profile_user u where u.status=1
limit ${limit} offset ${offset};