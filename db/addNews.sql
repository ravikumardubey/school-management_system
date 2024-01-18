INSERT INTO public.table_news (user_id, title, body, data_url, data_type, datetime, created_at, updated_at,
                               college_name, reference_url)
values (${user_id}, ${title}, ${body}, ${data_url}, ${data_type}, ${datetime}, Now(), Now(), ${college},
        ${reference_url});