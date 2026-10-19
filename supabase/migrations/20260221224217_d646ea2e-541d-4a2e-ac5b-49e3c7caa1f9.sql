
-- Create shipping_addresses table
CREATE TABLE public.shipping_addresses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  division TEXT NOT NULL,
  district TEXT NOT NULL,
  upazila TEXT,
  address TEXT NOT NULL,
  address_type TEXT NOT NULL DEFAULT 'home',
  is_default BOOLEAN NOT NULL DEFAULT false,
  delivery_charge NUMERIC NOT NULL DEFAULT 130,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.shipping_addresses ENABLE ROW LEVEL SECURITY;

-- Users can view their own addresses
CREATE POLICY "Users view own addresses"
ON public.shipping_addresses FOR SELECT
USING (user_id = auth.uid());

-- Users can insert own addresses
CREATE POLICY "Users insert own addresses"
ON public.shipping_addresses FOR INSERT
WITH CHECK (user_id = auth.uid());

-- Users can update own addresses
CREATE POLICY "Users update own addresses"
ON public.shipping_addresses FOR UPDATE
USING (user_id = auth.uid());

-- Users can delete own addresses
CREATE POLICY "Users delete own addresses"
ON public.shipping_addresses FOR DELETE
USING (user_id = auth.uid());

-- Admins can manage all addresses
CREATE POLICY "Admins manage addresses"
ON public.shipping_addresses FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Trigger for updated_at
CREATE TRIGGER update_shipping_addresses_updated_at
BEFORE UPDATE ON public.shipping_addresses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
