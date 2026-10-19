-- Fix categories: drop restrictive SELECT policy and recreate as permissive
DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories"
  ON public.categories
  FOR SELECT
  USING (true);

-- Fix medicines: same issue
DROP POLICY IF EXISTS "Anyone can read medicines" ON public.medicines;
CREATE POLICY "Anyone can read medicines"
  ON public.medicines
  FOR SELECT
  USING (true);

-- Fix delivery_zones
DROP POLICY IF EXISTS "Anyone can read delivery zones" ON public.delivery_zones;
CREATE POLICY "Anyone can read delivery zones"
  ON public.delivery_zones
  FOR SELECT
  USING (true);

-- Fix doctors
DROP POLICY IF EXISTS "Anyone can read doctors" ON public.doctors;
CREATE POLICY "Anyone can read doctors"
  ON public.doctors
  FOR SELECT
  USING (true);

-- Fix reviews
DROP POLICY IF EXISTS "Anyone can read reviews" ON public.reviews;
CREATE POLICY "Anyone can read reviews"
  ON public.reviews
  FOR SELECT
  USING (true);