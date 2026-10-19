
-- Create wishlists table
CREATE TABLE public.wishlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  medicine_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, medicine_id)
);

-- Add foreign keys
ALTER TABLE public.wishlists
  ADD CONSTRAINT wishlists_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD CONSTRAINT wishlists_medicine_id_fkey FOREIGN KEY (medicine_id) REFERENCES public.medicines(id) ON DELETE CASCADE;

-- Enable RLS
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users view own wishlists" ON public.wishlists FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Users insert own wishlists" ON public.wishlists FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users delete own wishlists" ON public.wishlists FOR DELETE USING (user_id = auth.uid());
CREATE POLICY "Admins manage wishlists" ON public.wishlists FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
