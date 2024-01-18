Insert into public.table_live_class_temp(user_id, class_id, meeting_no, start_time, end_time, created_at, updated_at,
                                         status)
VALUES (${user_id}, ${class_id}, ${meeting_no}, ${start_time}, null, Now(), Now(), ${status})
returning live_class_id;