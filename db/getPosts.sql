SELECT profile_user.id, profile_user.name, profile_user.photo_url, posts_table.*
FROM public.profile_user,
     public.posts_table
WHERE profile_user.id = posts_table.user_id;