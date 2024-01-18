BEGIN;
UPDATE public.drafts_table d
SET draft_body   = ${draft_body},
    draft_images = ${draft_images},
    draft_video  = ${draft_video},
    updated_at   = Now()
where d.user_id = ${user_id}
  and d.draft_id = ${draft_id};
COMMIT;
