SELECT *
FROM public.table_resources
WHERE university_name = ${university_name}
  AND college_name = ${college_name}
LIMIT ${limit} OFFSET ${offset};