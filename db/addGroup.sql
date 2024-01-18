INSERT INTO public.table_groups(user_id, group_name, group_description, group_icon, group_participants, created_at,
                                updated_at)
VALUES (${user_id}, ${group_name}, ${group_description}, ${group_icon}, ${group_participants}, now(), now())
RETURNING group_id;
