select c.class_name,
       c.course,
       c.year,
       c.semester,
       l.live_class_id,
       l.class_id,
       l.start_time,
       l.end_time,
       l.status,
       l.user_id,
       l.meeting_no
from public.table_live_class_temp l,
     public.table_user_classes p,
     public.class_table c,
     jsonb_to_recordset(p.class_ids) as class_ids(id integer)
where p.user_id = ${user_id}
  and c.class_id = class_ids.id
  and l.class_id = c.class_id
order by l.updated_at desc
limit ${limit} offset ${offset};