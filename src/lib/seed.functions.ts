// Server function para garantir que os usuários seed existam no Lovable Cloud.
// Idempotente — só cria se o login ainda não estiver registrado.
import { createServerFn } from "@tanstack/react-start";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const SEED_DOMAIN = "plm.local";

type SeedUser = {
  login: string;
  full_name: string;
  password: string;
  role: "internal" | "supplier";
};

const SEED_USERS: SeedUser[] = [
  { login: "philipp.weber", full_name: "Philipp Weber", password: "Soma@1206", role: "internal" },
  { login: "supplier.teste", full_name: "Fornecedor Teste", password: "Soma@1206", role: "supplier" },
];

export const ensureSeedUsers = createServerFn({ method: "POST" }).handler(async () => {
  const results: Array<{ login: string; status: "created" | "exists" }> = [];

  for (const u of SEED_USERS) {
    const { data: existing } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("login", u.login)
      .maybeSingle();

    if (existing) {
      results.push({ login: u.login, status: "exists" });
      continue;
    }

    const email = `${u.login}@${SEED_DOMAIN}`;
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: u.password,
      email_confirm: true,
      user_metadata: {
        login: u.login,
        full_name: u.full_name,
        role: u.role,
      },
    });
    if (error) throw new Error(`Falha ao criar ${u.login}: ${error.message}`);
    results.push({ login: u.login, status: "created" });
  }

  return { ok: true, results };
});
