import { supabase } from "@/lib/supabase";

export async function getModules() {
  try {
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .order("order_index", { ascending: true });
    if (error) throw error;
    return { data: data ?? [], error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addModule({ label, icon = "box" }: { label: string; icon?: string }) {
  try {
    const { data: existing } = await supabase
      .from("modules")
      .select("order_index")
      .order("order_index", { ascending: false })
      .limit(1);
    const nextOrder = (existing?.[0]?.order_index ?? -1) + 1;
    const slug =
      label.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") +
      "-" +
      Date.now();

    const { data, error } = await supabase
      .from("modules")
      .insert({
        label,
        name: label,
        slug,
        icon,
        order_index: nextOrder,
        is_ai: false,
        fixed: false,
      })
      .select()
      .single();
    if (error) throw error;
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteModule(id: string) {
  try {
    const { error } = await supabase.from("modules").delete().eq("id", id);
    if (error) throw error;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}

export async function reorderModules(orderedIds: string[]) {
  try {
    const updates = await Promise.all(
      orderedIds.map((id, idx) =>
        supabase.from("modules").update({ order_index: idx }).eq("id", id),
      ),
    );
    const firstError = updates.find((r) => r.error)?.error;
    if (firstError) throw firstError;
    return { data: true, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
