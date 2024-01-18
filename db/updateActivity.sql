BEGIN;
UPDATE public.table_activity
SET activity_type       = ${activity_type},
    question_type       = ${question_type},
    title               = ${title},
    description         = ${description},
    total_questions     = ${total_questions},
    marks_detail        = ${marks_detail},
    time_detail         = ${time_detail},
    public_visibility   = ${public_visibility},
    visible_before_time = ${visible_before_time},
    submit_after_time   = ${submit_after_time},
    questions           = ${questions},
    attached_files      = ${attached_files},
    updated_at          = Now(),
    form_type           = ${form_type}
WHERE activity_id = ${activity_id};
COMMIT;