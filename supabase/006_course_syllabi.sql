begin;

alter table public.tt_open_courses
    add column if not exists "syllabusPath" text,
    add column if not exists "syllabusName" text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
    'course-syllabi',
    'course-syllabi',
    false,
    10485760,
    array['application/pdf']
)
on conflict (id) do update
set public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

commit;

notify pgrst, 'reload schema';
