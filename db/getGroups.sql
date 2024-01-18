select *
from public.table_groups
where (group_participants -> 'participants' @> ${json});