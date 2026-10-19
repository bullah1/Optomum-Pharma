
-- 1. Add 'rider' to app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'rider';

-- 2. Rider assignments table
CREATE TABLE public.rider_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  rider_id uuid NOT NULL REFERENCES public.profiles(id),
  status text NOT NULL DEFAULT 'assigned',
  picked_up_at timestamptz,
  delivered_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(order_id)
);

ALTER TABLE public.rider_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage assignments" ON public.rider_assignments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Riders view own assignments" ON public.rider_assignments FOR SELECT USING (rider_id = auth.uid());
CREATE POLICY "Riders update own assignments" ON public.rider_assignments FOR UPDATE USING (rider_id = auth.uid());

-- 3. Rider wallets table
CREATE TABLE public.rider_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.profiles(id) UNIQUE,
  balance numeric NOT NULL DEFAULT 0,
  total_earned numeric NOT NULL DEFAULT 0,
  total_deposited numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rider_wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage wallets" ON public.rider_wallets FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Riders view own wallet" ON public.rider_wallets FOR SELECT USING (rider_id = auth.uid());

-- 4. Rider wallet transactions
CREATE TABLE public.rider_wallet_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.profiles(id),
  order_id uuid REFERENCES public.orders(id),
  amount numeric NOT NULL,
  type text NOT NULL DEFAULT 'credit',
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rider_wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage transactions" ON public.rider_wallet_transactions FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Riders view own transactions" ON public.rider_wallet_transactions FOR SELECT USING (rider_id = auth.uid());

-- 5. Rider deposit requests
CREATE TABLE public.rider_deposit_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rider_id uuid NOT NULL REFERENCES public.profiles(id),
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  admin_notes text,
  approved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.rider_deposit_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage deposit requests" ON public.rider_deposit_requests FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Riders view own deposits" ON public.rider_deposit_requests FOR SELECT USING (rider_id = auth.uid());
CREATE POLICY "Riders create deposit requests" ON public.rider_deposit_requests FOR INSERT WITH CHECK (rider_id = auth.uid());

-- 6. Trigger: auto-credit wallet on delivery
CREATE OR REPLACE FUNCTION public.credit_rider_on_delivery()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_rider_id uuid;
  v_order_total numeric;
BEGIN
  IF NEW.status = 'delivered' AND OLD.status IS DISTINCT FROM 'delivered' THEN
    -- Find assigned rider
    SELECT ra.rider_id INTO v_rider_id
    FROM public.rider_assignments ra
    WHERE ra.order_id = NEW.id;

    IF v_rider_id IS NOT NULL THEN
      v_order_total := NEW.total_amount + NEW.delivery_charge;

      -- Update assignment
      UPDATE public.rider_assignments
      SET status = 'delivered', delivered_at = now(), updated_at = now()
      WHERE order_id = NEW.id;

      -- Credit wallet
      INSERT INTO public.rider_wallet_transactions (rider_id, order_id, amount, type, description)
      VALUES (v_rider_id, NEW.id, v_order_total, 'credit', 'COD collection for order #' || LEFT(NEW.id::text, 8));

      -- Update wallet balance
      UPDATE public.rider_wallets
      SET balance = balance + v_order_total,
          total_earned = total_earned + v_order_total,
          updated_at = now()
      WHERE rider_id = v_rider_id;

      -- Create wallet if not exists
      IF NOT FOUND THEN
        INSERT INTO public.rider_wallets (rider_id, balance, total_earned)
        VALUES (v_rider_id, v_order_total, v_order_total);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_credit_rider_on_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.credit_rider_on_delivery();

-- 7. Trigger: wallet adjust on deposit approval
CREATE OR REPLACE FUNCTION public.process_deposit_approval()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    NEW.approved_at := now();
    
    -- Deduct from wallet
    UPDATE public.rider_wallets
    SET balance = balance - NEW.amount,
        total_deposited = total_deposited + NEW.amount,
        updated_at = now()
    WHERE rider_id = NEW.rider_id;

    -- Log transaction
    INSERT INTO public.rider_wallet_transactions (rider_id, amount, type, description)
    VALUES (NEW.rider_id, NEW.amount, 'debit', 'Cash deposit approved');
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_process_deposit_approval
BEFORE UPDATE ON public.rider_deposit_requests
FOR EACH ROW
EXECUTE FUNCTION public.process_deposit_approval();

-- 8. Updated_at triggers
CREATE TRIGGER update_rider_assignments_updated_at BEFORE UPDATE ON public.rider_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rider_wallets_updated_at BEFORE UPDATE ON public.rider_wallets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_rider_deposit_requests_updated_at BEFORE UPDATE ON public.rider_deposit_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
