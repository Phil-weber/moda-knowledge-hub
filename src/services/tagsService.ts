import { supabase } from "@/lib/supabase";

export interface FileTag {
  id: string;
  module_id: string | null;
  label: string;
  color: string;
  created_at: string;
}

export async function getTagsForModule(moduleId: string) {
  try {
    const { data, error } = await supabase
      .from("file_tags" as any)
      .select("*")
      .eq("module_id", moduleId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return { data: (data ?? []) as unknown as FileTag[], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addTagToModule(moduleId: string, label: string, color: string) {
  try {
    const { data, error } = await supabase
      .from("file_tags" as any)
      .insert({ module_id: moduleId, label, color } as any)
      .select()
      .single();
    if (error) throw error;
    return { data: data as unknown as FileTag, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteTag(tagId: string) {
  try {
    const { error } = await supabase.from("file_tags" as any).delete().eq("id", tagId);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
