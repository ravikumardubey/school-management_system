SELECT p.id, p.role, p.name
FROM PUBLIC.profile_user p

WHERE p.name LIKE ('%' || ${keyword} || '%')
LIMIT ${in_limit} OFFSET ${in_offset};
