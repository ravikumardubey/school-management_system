select c.class_name,
       c.course,
       c.year,
       c.semester,
       l.class_id,
       l.start_time,
       l.end_time,
       l.status,
       l.user_id,
       l.meeting_no
from public.table_live_class_temp l,
     public.class_table c
where (l.class_id = 23 or l.class_id = 34 or l.class_id = 45 or l.class_id = 56)
  and l.class_id = c.class_id
limit ${limit} offset ${offset};
