BEGIN;
INSERT INTO public.fcm_tokens (user_id, fcm_token, created_at, updated_at)
VALUES (${user_id}, ${user_token}, now(), now())
on conflict (user_id) do update SET fcm_token=${user_token},
                                    updated_at=now()
where fcm_tokens.user_id = ${user_id};
COMMIT;