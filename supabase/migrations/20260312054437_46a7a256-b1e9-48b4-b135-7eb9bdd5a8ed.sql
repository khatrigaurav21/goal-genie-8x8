
CREATE TABLE public.shared_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  goal text NOT NULL,
  pillars jsonb NOT NULL,
  high_impact jsonb DEFAULT '[]'::jsonb,
  completed_tasks jsonb DEFAULT '[]'::jsonb,
  language text DEFAULT 'en',
  strategy text DEFAULT 'balanced',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.shared_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read shared plans"
  ON public.shared_plans
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert shared plans"
  ON public.shared_plans
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);
