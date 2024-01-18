SELECT *
FROM public.table_notifications_educational
WHERE university_name = ${university_name}
LIMIT ${limit} OFFSET ${offset};