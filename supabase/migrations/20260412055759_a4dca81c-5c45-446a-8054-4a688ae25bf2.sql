
DROP POLICY IF EXISTS "Users can read own lab reports" ON storage.objects;
CREATE POLICY "Users can read own lab reports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'lab-reports'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR has_role(auth.uid(), 'admin'::app_role)
  )
);
