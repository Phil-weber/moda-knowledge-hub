
ALTER TABLE public.files
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS tag text,
  ADD COLUMN IF NOT EXISTS tag_color text,
  ADD COLUMN IF NOT EXISTS cover_path text,
  ADD COLUMN IF NOT EXISTS view_count int DEFAULT 0;

CREATE TABLE IF NOT EXISTS public.file_tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.modules(id) ON DELETE CASCADE,
  label text NOT NULL,
  color text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.file_tags TO anon, authenticated;
GRANT ALL ON public.file_tags TO service_role;

ALTER TABLE public.file_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "file_tags_all_public" ON public.file_tags
  FOR ALL USING (true) WITH CHECK (true);

INSERT INTO public.file_tags (module_id, label, color)
SELECT m.id, t.label, t.color
FROM public.modules m
CROSS JOIN (VALUES
  ('Manual', '#1a4bb5'),
  ('Treinamento', '#2e7d32'),
  ('Referência', '#9a6c00'),
  ('Coleção 2026', '#ad1457')
) AS t(label, color)
WHERE NOT EXISTS (
  SELECT 1 FROM public.file_tags ft WHERE ft.module_id = m.id AND ft.label = t.label
);
