SELECT s.user_id, pu.name, pu.photo_url
FROM PUBLIC.profile_student s
         INNER JOIN profile_user pu
                    ON s.user_id = pu.id
WHERE s.university_name = ${university_name}
  AND s.college_name = ${college}
  AND s.course = ${course}
  AND s.year = ${year}
LIMIT ${limit} OFFSET ${offset};