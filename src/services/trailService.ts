import { supabase } from "@/lib/supabase";

export async function getTrail(moduleId) {
  try {
    const { data, error } = await supabase
      .from("onboarding_trails")
      .select("file_order")
      .eq("module_id", moduleId)
      .maybeSingle();
    if (error) throw error;
    return { data: data?.file_order ?? [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function saveTrail(moduleId, fileOrder) {
  try {
    const { data, error } = await supabase
      .from("onboarding_trails")
      .upsert(
        {
          module_id: moduleId,
          file_order: fileOrder,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "module_id" },
      )
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
