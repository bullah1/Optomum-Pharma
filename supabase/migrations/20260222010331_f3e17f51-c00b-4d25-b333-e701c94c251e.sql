
-- Create health_tips table
CREATE TABLE public.health_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  icon TEXT NOT NULL DEFAULT '💡',
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_tips ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can read active health tips"
ON public.health_tips FOR SELECT
USING (true);

-- Admin manage
CREATE POLICY "Admins manage health tips"
ON public.health_tips FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Seed initial data
INSERT INTO public.health_tips (title, description, icon, sort_order) VALUES
('Control Your Diabetes', 'Exercise regularly and eat a balanced diet', '💉', 1),
('Keep Your Heart Healthy', 'Walk at least 30 minutes every day', '❤️', 2),
('Take Care of Your Eyes', 'Reduce screen time and get enough sleep', '👁️', 3);
