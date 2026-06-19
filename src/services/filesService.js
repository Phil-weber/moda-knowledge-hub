import { supabase } from "@/lib/supabase";

const BUCKET = "plm-files";

export async function getFiles(moduleId) {
  try {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function uploadFile(moduleId, file, title, type, uploadedBy) {
  try {
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
    const storagePath = `${moduleId}/${Date.now()}_${safeName}`;

    const { error: uploadErr } = await supabase.storage
      .from(BUCKET)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.type || undefined,
      });
    if (uploadErr) throw uploadErr;

    const { data, error } = await supabase
      .from("files")
      .insert({
        module_id: moduleId,
        title,
        type,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: uploadedBy ?? null,
      })
      .select()
      .single();

    if (error) {
      // best-effort cleanup if DB insert fails
      await supabase.storage.from(BUCKET).remove([storagePath]);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getFileUrl(storagePath) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60); // 1h
    if (error) throw error;
    return { data: data.signedUrl, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteFile(id, storagePath) {
  try {
    if (storagePath) {
      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);
      if (storageErr) throw storageErr;
    }
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
