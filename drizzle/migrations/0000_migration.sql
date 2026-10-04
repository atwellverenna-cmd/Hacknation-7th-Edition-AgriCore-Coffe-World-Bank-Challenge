CREATE TABLE public.coops (
  code text PRIMARY KEY,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.coops TO service_role;
ALTER TABLE public.coops ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.reports (
  id text PRIMARY KEY,
  coop_code text NOT NULL REFERENCES public.coops(code) ON DELETE CASCADE,
  farmer_name text,
  diagnosis text NOT NULL,
  confidence double precision NOT NULL,
  tier text NOT NULL,
  severity integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  thumbnail text,
  reviewed_at timestamptz,
  outcome text,
  source text,
  visit_requested_at timestamptz,
  visit_note text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX reports_coop_idx ON public.reports (coop_code, created_at DESC);
GRANT ALL ON public.reports TO service_role;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

INSERT INTO public.coops (code, name) VALUES ('KIBALE-24', 'Kibale co-op');