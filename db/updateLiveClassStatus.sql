BEGIN;
UPDATE public.table_live_class_temp
set status = -1, end_time = ${end_time}
where live_class_id = ${last_live_class_id}