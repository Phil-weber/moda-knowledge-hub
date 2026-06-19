
CREATE POLICY "plm_files_select_authenticated" ON storage.objects
  FOR SELECT TO authenticated USING (bucket_id = 'plm-files');
CREATE POLICY "plm_files_insert_authenticated" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'plm-files');
CREATE POLICY "plm_files_update_authenticated" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'plm-files') WITH CHECK (bucket_id = 'plm-files');
CREATE POLICY "plm_files_delete_authenticated" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'plm-files');
