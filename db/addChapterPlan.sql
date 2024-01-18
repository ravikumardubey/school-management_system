BEGIN;

INSERT INTO public.table_chapter_plan(user_id, class_id, title, description, attached_url, attached_files, datetime,
                                      created_at, updated_at)
values (${user_id}, ${class_id}, ${title}, ${description}, ${attached_url}, ${attached_files}, ${dateTime}, now(),
        now())
ON CONFLICT (class_id) DO UPDATE SET title          = ${title},
                                     description    = ${description},
                                     attached_url= ${attached_url},
                                     attached_files = ${attached_files},
                                     datetime       = ${dateTime},
                                     updated_at     = Now()
WHERE table_chapter_plan.class_id = ${class_id};

COMMIT;