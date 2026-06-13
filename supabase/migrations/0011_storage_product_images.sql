insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
) values (
  'produk-images',
  'produk-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do update set
  name = excluded.name,
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "internal full access product images" on storage.objects;

create policy "internal full access product images"
  on storage.objects
  for all
  to authenticated
  using (
    bucket_id = 'produk-images'
    and public.is_internal_user()
  )
  with check (
    bucket_id = 'produk-images'
    and public.is_internal_user()
  );
