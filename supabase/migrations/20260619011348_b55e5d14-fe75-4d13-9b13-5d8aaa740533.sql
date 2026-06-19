
-- 1. Extend modules table with new columns
ALTER TABLE public.modules
  ADD COLUMN IF NOT EXISTS label text,
  ADD COLUMN IF NOT EXISTS is_ai boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS fixed boolean NOT NULL DEFAULT false;

-- Backfill label from existing name column
UPDATE public.modules SET label = name WHERE label IS NULL;

-- Make name/slug nullable so future inserts can use label only
ALTER TABLE public.modules ALTER COLUMN name DROP NOT NULL;
ALTER TABLE public.modules ALTER COLUMN slug DROP NOT NULL;

-- 2. files table
CREATE TABLE IF NOT EXISTS public.files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  type text NOT NULL CHECK (type IN ('pdf','video','ppt','doc')),
  storage_path text NOT NULL,
  file_name text,
  file_size bigint,
  uploaded_by text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO authenticated;
GRANT ALL ON public.files TO service_role;

ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

CREATE POLICY "files_select_authenticated" ON public.files
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "files_insert_authenticated" ON public.files
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "files_update_authenticated" ON public.files
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "files_delete_authenticated" ON public.files
  FOR DELETE TO authenticated USING (true);

-- 3. onboarding_trails table
CREATE TABLE IF NOT EXISTS public.onboarding_trails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL UNIQUE REFERENCES public.modules(id) ON DELETE CASCADE,
  file_order jsonb NOT NULL DEFAULT '[]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_trails TO authenticated;
GRANT ALL ON public.onboarding_trails TO service_role;

ALTER TABLE public.onboarding_trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "trails_select_authenticated" ON public.onboarding_trails
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "trails_insert_authenticated" ON public.onboarding_trails
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "trails_update_authenticated" ON public.onboarding_trails
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "trails_delete_authenticated" ON public.onboarding_trails
  FOR DELETE TO authenticated USING (true);

-- updated_at trigger for onboarding_trails
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS update_onboarding_trails_updated_at ON public.onboarding_trails;
CREATE TRIGGER update_onboarding_trails_updated_at
  BEFORE UPDATE ON public.onboarding_trails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Loosen modules write policies for MVP (any authenticated user can write)
DROP POLICY IF EXISTS modulos_delete_interno ON public.modules;
DROP POLICY IF EXISTS modulos_insert_interno ON public.modules;
DROP POLICY IF EXISTS modulos_update_interno ON public.modules;

CREATE POLICY "modules_insert_authenticated" ON public.modules
  FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "modules_update_authenticated" ON public.modules
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "modules_delete_authenticated" ON public.modules
  FOR DELETE TO authenticated USING (true);

-- 5. Seed initial modules (idempotent via slug)
INSERT INTO public.modules (label, name, slug, icon, order_index, is_ai, fixed) VALUES
  ('Tech Pack','Tech Pack','tech-pack','box',0,false,true),
  ('Supplier','Supplier','supplier','truck',1,false,false),
  ('Planning','Planning','planning','calendar',2,false,false),
  ('Fitting','Fitting','fitting','scissors',3,false,false),
  ('Color','Color','color','color',4,false,false),
  ('PCP','PCP','pcp','settings',5,false,false),
  ('Quality','Quality','quality','shield',6,false,false),
  ('Dados','Dados','dados','chart',7,false,false),
  ('FAQ — IA','FAQ — IA','faq-ia','bot',8,true,true)
ON CONFLICT DO NOTHING;
