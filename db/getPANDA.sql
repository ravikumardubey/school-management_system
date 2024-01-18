SELECT a.activity_id,
       a.class_id,
       a.activity_type,
       a.question_type,
       a.title,
       a.description,
       a.total_questions,
       a.marks_detail,
       a.time_detail,
       a.visible_before_time,
       a.submit_after_time,
       a.questions,
       a.attached_files,
       a.datetime,
       a.user_id as teacher_id,
       a.form_type
from table_activity as a
WHERE (a.class_id = ${class_id}
    AND (a.activity_type = 0 or a.activity_type = 1))
LIMIT ${limit} OFFSET ${offset};