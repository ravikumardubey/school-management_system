BEGIN;
INSERT INTO public.profile_user(uuid, name, email, encrypted_password, salt, phone_no, role, gender, created_at,
                                updated_at, photo_url, dob, status)
VALUES (${uid}, ${name}, ${email}, ${encrypted_password}, ${salt}, ${phone_no}, ${role}, ${gender}, Now(), Now(),
        ${photo_url}, ${dob}, 1)
returning *;
COMMIT;