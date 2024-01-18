UPDATE public.table_resources
SET assigned_to    = ${assigned_to},
    attached_files = ${attached_files},
    datetime       = ${datetime},
    updated_at     = now()
WHERE resource_id = ${resource_id};