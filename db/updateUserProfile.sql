BEGIN;
UPDATE public.profile_user
SET name       = ${name},
    dob        = ${dob},
    gender     = ${gender},
    photo_url  = ${photo_url},
    updated_at = Now()
where profile_user.id = ${user_id};
COMMIT;