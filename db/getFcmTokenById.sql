select f.fcm_token
from fcm_tokens f
where f.user_id = ${receiver_id}