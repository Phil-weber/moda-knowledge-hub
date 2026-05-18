
-- Enum de papéis
create type public.app_role as enum ('internal', 'supplier');

-- Tabela de perfis (1:1 com auth.users)
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  login varchar(80) not null unique,
  full_name varchar(160) not null,
  role public.app_role not null default 'internal',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Função security definer para checar papéis (evita recursão em RLS)
create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = _user_id and role = _role
  )
$$;

-- Helper para pegar role do usuário corrente
create or replace function public.current_role_value()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- Policies profiles
create policy "perfis_select_autenticado"
  on public.profiles for select
  to authenticated
  using (true);

create policy "perfis_update_proprio"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Trigger: cria perfil automaticamente ao criar usuário
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, login, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'login', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data->>'role')::public.app_role, 'internal')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Tabela de módulos
create table public.modules (
  id uuid primary key default gen_random_uuid(),
  name varchar(120) not null,
  slug varchar(120) not null unique,
  icon varchar(60) not null,
  order_index int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.modules enable row level security;

create policy "modulos_select_autenticado"
  on public.modules for select
  to authenticated
  using (true);

create policy "modulos_insert_interno"
  on public.modules for insert
  to authenticated
  with check (public.has_role(auth.uid(), 'internal'));

create policy "modulos_update_interno"
  on public.modules for update
  to authenticated
  using (public.has_role(auth.uid(), 'internal'));

create policy "modulos_delete_interno"
  on public.modules for delete
  to authenticated
  using (public.has_role(auth.uid(), 'internal'));

-- Seed dos módulos iniciais
insert into public.modules (name, slug, icon, order_index) values
  ('Tech Pack', 'tech-pack', 'Package', 1),
  ('Supplier', 'supplier', 'Truck', 2),
  ('Planning', 'planning', 'Calendar', 3),
  ('Fitting', 'fitting', 'Scissors', 4),
  ('Color', 'color', 'Palette', 5),
  ('PCP', 'pcp', 'Settings2', 6),
  ('Quality', 'quality', 'ShieldCheck', 7),
  ('Dados', 'dados', 'BarChart2', 8),
  ('FAQ — IA', 'faq-ia', 'MessageCircle', 9);
