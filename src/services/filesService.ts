import { supabase } from "@/lib/supabase";

const BUCKET = "plm-files";
const COVER_BUCKET = "plm-covers";

export interface UploadOpts {
  title: string;
  type: string;
  description?: string | null;
  tag?: string | null;
  tagColor?: string | null;
  coverFile?: File | null;
  uploadedBy?: string | null;
}

export async function getFiles(moduleId: string) {
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

export async function uploadFile(
  moduleId: string,
  file: File,
  opts: UploadOpts,
) {
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

    let coverPath: string | null = null;
    if (opts.coverFile) {
      const safeCover = opts.coverFile.name.replace(/[^a-zA-Z0-9._-]+/g, "_");
      coverPath = `${moduleId}/${Date.now()}_cover_${safeCover}`;
      const { error: coverErr } = await supabase.storage
        .from(COVER_BUCKET)
        .upload(coverPath, opts.coverFile, {
          cacheControl: "3600",
          upsert: false,
          contentType: opts.coverFile.type || undefined,
        });
      if (coverErr) {
        await supabase.storage.from(BUCKET).remove([storagePath]);
        throw coverErr;
      }
    }

    const { data, error } = await supabase
      .from("files")
      .insert({
        module_id: moduleId,
        title: opts.title,
        type: opts.type,
        storage_path: storagePath,
        file_name: file.name,
        file_size: file.size,
        uploaded_by: opts.uploadedBy ?? null,
        description: opts.description ?? null,
        tag: opts.tag ?? null,
        tag_color: opts.tagColor ?? null,
        cover_path: coverPath,
      } as any)
      .select()
      .single();

    if (error) {
      await supabase.storage.from(BUCKET).remove([storagePath]);
      if (coverPath) await supabase.storage.from(COVER_BUCKET).remove([coverPath]);
      throw error;
    }
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getFileUrl(storagePath: string) {
  try {
    const { data, error } = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(storagePath, 60 * 60);
    if (error) throw error;
    return { data: data.signedUrl, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getCoverUrl(coverPath: string) {
  try {
    const { data, error } = await supabase.storage
      .from(COVER_BUCKET)
      .createSignedUrl(coverPath, 60 * 60);
    if (error) throw error;
    return data.signedUrl;
  } catch {
    return null;
  }
}

export async function incrementViewCount(fileId: string) {
  try {
    const { data: row } = await supabase
      .from("files")
      .select("view_count")
      .eq("id", fileId)
      .maybeSingle();
    const next = ((row as any)?.view_count ?? 0) + 1;
    const { error } = await supabase
      .from("files")
      .update({ view_count: next } as any)
      .eq("id", fileId);
    if (error) throw error;
    return { data: next, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteFile(id: string, storagePath: string, coverPath?: string | null) {
  try {
    if (storagePath) {
      const { error: storageErr } = await supabase.storage
        .from(BUCKET)
        .remove([storagePath]);
      if (storageErr) throw storageErr;
    }
    if (coverPath) {
      await supabase.storage.from(COVER_BUCKET).remove([coverPath]);
    }
    const { error } = await supabase.from("files").delete().eq("id", id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
