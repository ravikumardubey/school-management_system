SELECT r.*
FROM PUBLIC.table_resources r
WHERE ((r.title LIKE '%' || ${keyword} || '%')
    OR r.description LIKE ('%' || ${keyword} || '%'))
  AND r.assigned_to LIKE ('%' || ${class_id} || '%')
LIMIT ${limit} OFFSET ${offset};