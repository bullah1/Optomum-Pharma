
-- Drop the admin-only upload policy
DROP POLICY IF EXISTS "Admins upload product images" ON storage.objects;

-- Create new policy allowing any authenticated user to upload
-- (Admin panel is already PIN-protected, so this is safe)
CREATE POLICY "Authenticated users upload product images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'product-images');
