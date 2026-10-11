-- Atelier: esquema inicial y acceso exclusivo para la cuenta personal.
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 120),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.boards (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 120),
  scene jsonb not null default '{"elements": []}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists boards_project_id_idx on public.boards(project_id);
create index if not exists projects_owner_id_idx on public.projects(owner_id);

alter table public.projects enable row level security;
alter table public.boards enable row level security;

-- Solo la cuenta indicada puede consultar o modificar contenido.
create policy "theta owner manages projects" on public.projects for all to authenticated
  using ((auth.jwt() ->> 'email') = 'dulantopruebas@gmail.com')
  with check ((auth.jwt() ->> 'email') = 'dulantopruebas@gmail.com' and owner_id = auth.uid());

create policy "theta owner manages boards" on public.boards for all to authenticated
  using ((auth.jwt() ->> 'email') = 'dulantopruebas@gmail.com' and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()))
  with check ((auth.jwt() ->> 'email') = 'dulantopruebas@gmail.com' and exists (select 1 from public.projects p where p.id = project_id and p.owner_id = auth.uid()));

create or replace function public.set_updated_at()
returns trigger language plpgsql security invoker set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger projects_set_updated_at before update on public.projects for each row execute function public.set_updated_at();
create trigger boards_set_updated_at before update on public.boards for each row execute function public.set_updated_at();
