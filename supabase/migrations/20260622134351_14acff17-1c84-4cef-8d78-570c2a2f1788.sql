
-- TABELAS
DROP POLICY IF EXISTS modulos_select_autenticado ON public.modules;
DROP POLICY IF EXISTS modules_insert_authenticated ON public.modules;
DROP POLICY IF EXISTS modules_update_authenticated ON public.modules;
DROP POLICY IF EXISTS modules_delete_authenticated ON public.modules;
CREATE POLICY modules_all_public ON public.modules FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.modules TO anon;

DROP POLICY IF EXISTS files_select_authenticated ON public.files;
DROP POLICY IF EXISTS files_insert_authenticated ON public.files;
DROP POLICY IF EXISTS files_update_authenticated ON public.files;
DROP POLICY IF EXISTS files_delete_authenticated ON public.files;
CREATE POLICY files_all_public ON public.files FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.files TO anon;

DROP POLICY IF EXISTS trails_select_authenticated ON public.onboarding_trails;
DROP POLICY IF EXISTS trails_insert_authenticated ON public.onboarding_trails;
DROP POLICY IF EXISTS trails_update_authenticated ON public.onboarding_trails;
DROP POLICY IF EXISTS trails_delete_authenticated ON public.onboarding_trails;
CREATE POLICY trails_all_public ON public.onboarding_trails FOR ALL USING (true) WITH CHECK (true);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.onboarding_trails TO anon;

-- STORAGE (bucket continua privado; URLs assinadas)
DROP POLICY IF EXISTS "plm-files authenticated read" ON storage.objects;
DROP POLICY IF EXISTS "plm-files authenticated insert" ON storage.objects;
DROP POLICY IF EXISTS "plm-files authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "plm-files authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "plm-files public read" ON storage.objects;
DROP POLICY IF EXISTS "plm-files public insert" ON storage.objects;
DROP POLICY IF EXISTS "plm-files public update" ON storage.objects;
DROP POLICY IF EXISTS "plm-files public delete" ON storage.objects;

CREATE POLICY "plm-files public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'plm-files');
CREATE POLICY "plm-files public insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'plm-files');
CREATE POLICY "plm-files public update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'plm-files');
CREATE POLICY "plm-files public delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'plm-files');
