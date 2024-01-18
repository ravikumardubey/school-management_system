select c.class_name,
       c.course,
       c.year,
       c.semester,
       l.class_id,
       l.live_class_id,
       l.start_time,
       l.end_time,
       l.status
from public.table_live_class_temp l,
     public.class_table c
where l.user_id = ${user_id}
  and l.class_id = c.class_id
limit ${limit} offset ${offset};