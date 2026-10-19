
-- Create order_status_logs table (was missing from previous migration)
CREATE TABLE IF NOT EXISTS public.order_status_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  previous_status text,
  new_status text NOT NULL,
  changed_by uuid REFERENCES public.profiles(id),
  changed_by_role text DEFAULT 'system',
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.order_status_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage status logs" ON public.order_status_logs FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users view own order logs" ON public.order_status_logs FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders WHERE orders.id = order_status_logs.order_id AND orders.user_id = auth.uid()));
CREATE POLICY "System can insert logs" ON public.order_status_logs FOR INSERT WITH CHECK (true);

-- Trigger to auto-log order status changes
CREATE OR REPLACE FUNCTION public.log_order_status_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.order_status_logs (order_id, previous_status, new_status, changed_by, changed_by_role)
    VALUES (NEW.id, OLD.status, NEW.status, auth.uid(), COALESCE((SELECT role::text FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1), 'system'));
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_log_order_status_change AFTER UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.log_order_status_change();

-- Index for status logs
CREATE INDEX IF NOT EXISTS idx_order_status_logs_order_id ON public.order_status_logs (order_id);

-- Enable pg_trgm + search indexes
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX IF NOT EXISTS idx_medicines_name ON public.medicines USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_name_bn ON public.medicines USING gin (name_bn gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_company ON public.medicines USING gin (company gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_medicines_category_id ON public.medicines (category_id);
CREATE INDEX IF NOT EXISTS idx_medicines_slug ON public.medicines (slug);
CREATE INDEX IF NOT EXISTS idx_medicines_created_at ON public.medicines (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medicines_stock ON public.medicines (stock);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders (user_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_medicine_id ON public.order_items (medicine_id);
