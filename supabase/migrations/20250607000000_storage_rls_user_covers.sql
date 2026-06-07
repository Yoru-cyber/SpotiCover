-- Add RLS policies for user_covers storage bucket
-- Path structure: {userId}/{uuid}.png

-- Allow public read access (bucket is public for sharing)
CREATE POLICY "Public read access for user_covers"
ON storage.objects
FOR SELECT
USING (bucket_id = 'user_covers');

-- Allow insert only if the first folder matches authenticated user's ID
CREATE POLICY "Users can upload to own folder"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'user_covers'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow delete only if the first folder matches authenticated user's ID
CREATE POLICY "Users can delete own files"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'user_covers'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
