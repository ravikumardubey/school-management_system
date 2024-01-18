SELECT n.*, u.name
FROM public.table_news n,
     public.profile_user u
where n.user_id = u.id
order by created_at desc
LIMIT ${limit} OFFSET ${offset};