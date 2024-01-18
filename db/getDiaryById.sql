SELECT d.diary_body, d.diary_date, d.user_id
FROM PUBLIC.diary_entry d
WHERE d.user_id = ${user_id}
  and d.diary_date = ${diary_date}

