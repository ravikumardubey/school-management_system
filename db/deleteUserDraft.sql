BEGIN;
delete
from drafts_table d
where d.user_id = ${user_id}
  and d.draft_id = ${draft_id};
COMMIT;