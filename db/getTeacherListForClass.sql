SELECT t.user_id, pu.name, pu.photo_url
FROM PUBLIC.profile_teacher t
         INNER JOIN profile_user pu
                    ON t.user_id = pu.id
WHERE t.university_name = ${university_name}
  AND t.college_name = ${college}
LIMIT ${limit} OFFSET ${offset};