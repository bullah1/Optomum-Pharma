
-- Inventory / Stock movement tracking
CREATE TABLE public.inventory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
  type text NOT NULL DEFAULT 'in' CHECK (type IN ('in', 'out')),
  quantity integer NOT NULL DEFAULT 0,
  batch_number text,
  expiry_date date,
  purchase_price numeric NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;

-- Only admins can manage inventory
CREATE POLICY "Admins manage inventory"
  ON public.inventory
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));
