-- Backfill empty profile name/phone from user's most recent shipping address
-- Fixes "Unknown" customer names in admin orders for users who never updated their profile
UPDATE public.profiles p
SET 
  name = COALESCE(NULLIF(TRIM(p.name), ''), sa.name),
  phone = COALESCE(NULLIF(TRIM(p.phone), ''), sa.phone)
FROM (
  SELECT DISTINCT ON (user_id) user_id, name, phone
  FROM public.shipping_addresses
  WHERE name IS NOT NULL AND name <> ''
  ORDER BY user_id, created_at DESC
) sa
WHERE p.id = sa.user_id
  AND (p.name IS NULL OR TRIM(p.name) = '' OR p.phone IS NULL OR TRIM(p.phone) = '');