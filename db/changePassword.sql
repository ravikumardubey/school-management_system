BEGIN;
UPDATE public.profile_user
SET encrypted_password=${encrypted_password},
    salt=${salt}
WHERE email = ${email};
COMMIT;