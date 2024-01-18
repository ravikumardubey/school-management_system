select Count(activity_id)
from public.table_activity_submission
where activity_id = ${activity_id}
  and class_id = ${class_id};