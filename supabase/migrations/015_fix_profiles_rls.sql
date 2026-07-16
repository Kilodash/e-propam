-- Fix RLS infinite recursion di policy profiles
-- Penyebab: "Admins can read all profiles" query ke public.profiles di dalam policy itu sendiri
-- Solusi: drop policy yang recursion, atau ganti dengan function SECURITY DEFINER

drop policy if exists "Admins can read all profiles" on public.profiles;
drop policy if exists "Admins can insert profiles" on public.profiles;

-- Ganti dengan function SECURITY DEFINER untuk cek admin tanpa trigger recursion
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Policy baru: admin bisa baca semua profiles via function
create policy "Admins can read all profiles" on public.profiles
  for select using (
    auth.uid() = id  -- own profile
    or
    public.is_admin()  -- admin via SECURITY DEFINER (no recursion)
  );

-- Admin bisa manage profiles
create policy "Admins can update profiles" on public.profiles
  for update using (public.is_admin());

create policy "Admins can insert profiles" on public.profiles
  for insert with check (public.is_admin());
