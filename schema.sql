-- Ruang Belajar JFT: skema Supabase. Jalankan di Supabase > SQL Editor > New query > Run.
-- Ganti tora699669@gmail.com dengan email Google guru sebelum menjalankan.

create table if not exists public.docs (
  path text primary key,
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table if not exists public.teachers (email text primary key);
create table if not exists public.allowed_emails (email text primary key);
create table if not exists public.profiles (
  id uuid primary key,
  email text,
  name text,
  avatar_url text,
  updated_at timestamptz not null default now()
);

create or replace function public.is_teacher() returns boolean
language sql stable security definer set search_path = public as $$
  select exists(select 1 from public.teachers t where lower(t.email) = lower(coalesce(auth.jwt()->>'email','')));
$$;
create or replace function public.is_member() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_teacher() or exists(select 1 from public.allowed_emails a where lower(a.email) = lower(coalesce(auth.jwt()->>'email','')));
$$;

alter table public.docs enable row level security;
alter table public.teachers enable row level security;
alter table public.allowed_emails enable row level security;
alter table public.profiles enable row level security;

-- Pemetaan aturan lama: results/{uid}, ktk/{uid}, board/{uid} dan data/users/{uid}/... hanya milik uid itu.
-- board dan config dibaca semua anggota. config hanya ditulis guru. Selain itu hanya guru.
create or replace function public.doc_own(p text) returns boolean
language sql stable as $$
  select auth.uid() is not null and (
    (split_part(p,'/',1) in ('results','ktk','board') and split_part(p,'/',2) = auth.uid()::text)
    or (split_part(p,'/',1) = 'data' and split_part(p,'/',2) = 'users' and split_part(p,'/',3) = auth.uid()::text)
  );
$$;

drop policy if exists docs_select on public.docs;
create policy docs_select on public.docs for select to authenticated using (
  public.is_teacher() or (public.is_member() and (split_part(path,'/',1) in ('board','config') or public.doc_own(path)))
);
drop policy if exists docs_insert on public.docs;
create policy docs_insert on public.docs for insert to authenticated with check (
  public.is_teacher() or (public.is_member() and public.doc_own(path))
);
drop policy if exists docs_update on public.docs;
create policy docs_update on public.docs for update to authenticated
  using (public.is_teacher() or (public.is_member() and public.doc_own(path)))
  with check (public.is_teacher() or (public.is_member() and public.doc_own(path)));
drop policy if exists docs_delete on public.docs;
create policy docs_delete on public.docs for delete to authenticated using (
  public.is_teacher() or (public.is_member() and public.doc_own(path))
);

drop policy if exists prof_select on public.profiles;
create policy prof_select on public.profiles for select to authenticated using (id = auth.uid() or public.is_teacher());
drop policy if exists prof_ins on public.profiles;
create policy prof_ins on public.profiles for insert to authenticated with check (id = auth.uid());
drop policy if exists prof_upd on public.profiles;
create policy prof_upd on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- teachers dan allowed_emails: tidak ada policy, jadi tidak bisa dibaca atau diubah dari aplikasi (hanya lewat SQL Editor).

-- Realtime supaya panel guru dan peringkat langsung ter-update.
do $$ begin
  begin alter publication supabase_realtime add table public.docs; exception when duplicate_object then null; end;
end $$;

-- Guru dan murid yang boleh masuk.
insert into public.teachers(email) values ('tora699669@gmail.com') on conflict do nothing;
insert into public.allowed_emails(email) values
 ('yulianaeva10208@gmail.com'),('ajaintan079@gmail.com'),('sipapuji55@gmail.com'),('andiniratika9@gmail.com'),
 ('alzahiraanggraeni29@gmail.com'),('diansaputra2521@gmail.com'),('galihhputraaa4@gmail.com'),('mitaph2@gmail.com'),
 ('sitisrph21@gmail.com'),('rostndianaenengsiska@gmail.com'),('muhamadradinr@gmail.com'),('idrisefendi966@gmail.com'),
 ('sitinurfadilaharyanti08@gmail.com'),('alikashafa234@gmail.com'),('amenohabakiri853@gmail.com'),('mobilbutut0853@gmail.com'),
 ('zahrasrinofera@gmail.com'),('agstnarin859@gmail.com'),('muhamadapdalmaulana05@gmail.com'),('syahirasyahiraputri037@gmail.com'),
 ('tiarawr684@gmail.com'),('ahmadzakimuztaba@gmail.com'),('sitinurfauziah258@gmail.com')
on conflict do nothing;
