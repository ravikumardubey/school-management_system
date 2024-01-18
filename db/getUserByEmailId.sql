select id,
       name,
       email,
       phone_no,
       role,
       encrypted_password,
       salt,
       gender,
       photo_url,
       dob,
       updated_at,
       created_at
from profile_user
where email = ${email}