
-- Block anonymous SELECT on sensitive tables
CREATE POLICY "Deny anonymous access" ON public.profiles FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous access" ON public.inventory FOR SELECT TO anon USING (false);
CREATE POLICY "Deny anonymous access" ON public.lab_bookings FOR SELECT TO anon USING (false);
