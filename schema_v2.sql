-- Ruang Belajar JFT · pembaruan v2 (fitur game). Jalankan SEKALI di Supabase > SQL Editor > New query > Run.
-- Menambah: game/{uid} (avatar, nickname, statistik; dibaca semua anggota, ditulis pemiliknya)
--           grant/{uid} (Permata dan hadiah dari Sensei; dibaca pemiliknya, ditulis hanya Sensei)

create or replace function public.doc_own(p text) returns boolean
language sql stable as $$
  select auth.uid() is not null and (
    (split_part(p,'/',1) in ('results','ktk','board','game') and split_part(p,'/',2) = auth.uid()::text)
    or (split_part(p,'/',1) = 'data' and split_part(p,'/',2) = 'users' and split_part(p,'/',3) = auth.uid()::text)
  );
$$;

drop policy if exists docs_select on public.docs;
create policy docs_select on public.docs for select to authenticated using (
  public.is_teacher() or (public.is_member() and (
    split_part(path,'/',1) in ('board','config','game')
    or public.doc_own(path)
    or (split_part(path,'/',1) = 'grant' and split_part(path,'/',2) = auth.uid()::text)
  ))
);
-- insert/update/delete tetap memakai doc_own, jadi murid tidak bisa menulis grant/ (hanya Sensei).
