-- Seed akun untuk seluruh role + satker
-- Format: {identifier}_{slug}@ep.id
-- Password pattern: {role}!{4 random digit} — unik per user

do $$
declare
  rec record;
  pw text;
  pw_hash text;
begin
  for rec in
    values
      -- 0. Admin & global roles (no unit)
      ('00000000-0000-0000-0000-0000000000a1'::uuid, 'admin@ep.id', 'admin', null),
      ('00000000-0000-0000-0000-0000000000a2'::uuid, 'yanduan@ep.id', 'yanduan', null),

      -- 1. KABID
      ('00000000-0000-0000-0000-0000000000b1'::uuid, 'kabid@ep.id', 'kabid', 'KABID PROPAM POLDA JAWA BARAT'),

      -- 2. Yanduan + Operator
      ('00000000-0000-0000-0000-0000000000c1'::uuid, 'kasubbag_yanduan@ep.id', 'yanduan', 'KASUBBAG YANDUAN POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000c2'::uuid, 'operator_yanduan@ep.id', 'yanduan', 'OPERATOR YANDUAN POLDA JAWA BARAT'),

      -- 3. Rehabpers
      ('00000000-0000-0000-0000-0000000000d1'::uuid, 'kasubbag_rehabpers@ep.id', 'rehabpers', 'KASUBBAG REHABPERS POLDA JAWA BARAT'),

      -- 4. Paminal (kasubbid + units)
      ('00000000-0000-0000-0000-0000000000e1'::uuid, 'kasubbid_paminal@ep.id', 'paminal', 'KASUBBID PAMINAL POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000e2'::uuid, 'kaur_binpam_paminal@ep.id', 'paminal', 'KAUR BINPAM SUBBID PAMINAL POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000e3'::uuid, 'ur_binpam_paminal@ep.id', 'paminal', 'UR BINPAM SUBBID PAMINAL POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000e4'::uuid, 'ur_binpam_paminal_typo@ep.id', 'paminal', 'UR BINPAM SUBBID PAMINAL JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000e5'::uuid, 'unit2_paminal@ep.id', 'paminal', 'UNIT 2 SUBBID PAMINAL POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000e6'::uuid, 'unit3_paminal@ep.id', 'paminal', 'UNIT 3 SUBBID PAMINAL POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000e7'::uuid, 'unit1_paminal@ep.id', 'paminal', 'UNIT 1 SUBBID PAMINAL POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000e8'::uuid, 'ur_prodok_paminal@ep.id', 'paminal', 'UR PRODOK SUBBID PAMINAL POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000e9'::uuid, 'ur_litpers_paminal@ep.id', 'paminal', 'UR LITPERS SUBBID PAMINAL POLDA JAWA BARAT'),

      -- 5. Provos
      ('00000000-0000-0000-0000-0000000000f1'::uuid, 'kasubbid_provos@ep.id', 'provos', 'KASUBBID PROVOS POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000f2'::uuid, 'unit1_provos@ep.id', 'provos', 'UNIT 1 SUBBID PROVOS POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000f3'::uuid, 'unit2_provos@ep.id', 'provos', 'UNIT 2 SUBBID PROVOS POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-0000000000f4'::uuid, 'unit3_provos@ep.id', 'provos', 'UNIT 3 SUBBID PROVOS POLDA JAWA BARAT'),

      -- 6. Wabprof
      ('00000000-0000-0000-0000-000000000101'::uuid, 'kasubbid_wabprof@ep.id', 'wabprof', 'KASUBBID WABPROF POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-000000000106'::uuid, 'unit1_wabprof@ep.id', 'wabprof', 'UNIT 1 SUBBID WABPROF POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-000000000107'::uuid, 'unit2_wabprof@ep.id', 'wabprof', 'UNIT 2 SUBBID WABPROF POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-000000000108'::uuid, 'unit3_wabprof@ep.id', 'wabprof', 'UNIT 3 SUBBID WABPROF POLDA JAWA BARAT'),

      -- 7. Brimob
      ('00000000-0000-0000-0000-000000000102'::uuid, 'kasiprovos_satbrimob@ep.id', 'provos', 'KASIPROVOS SATBRIMOB POLDA JAWA BARAT'),

      -- 8. Ditpolair
      ('00000000-0000-0000-0000-000000000103'::uuid, 'kanit_paminal_ditpolair@ep.id', 'paminal', 'KANIT PAMINAL DITPOLAIR POLDA JAWA BARAT'),

      -- 9. Wassidik
      ('00000000-0000-0000-0000-000000000104'::uuid, 'wassidik_ditreskrimum@ep.id', 'wassidik', 'WASSIDIK DITRESKRIMUM POLDA JAWA BARAT'),
      ('00000000-0000-0000-0000-000000000105'::uuid, 'bag_wassidik@ep.id', 'wassidik', 'BAG WASSIDIK POLDA JAWA BARAT'),

      -- 10. POLRES
      ('00000000-0000-0000-0000-000000000201'::uuid, 'polrestabes_bandung@ep.id', 'polres', 'Polrestabes Bandung'),
      ('00000000-0000-0000-0000-000000000202'::uuid, 'kanit_paminal_polrestabes_bandung@ep.id', 'polres', 'Polrestabes Bandung'),
      ('00000000-0000-0000-0000-000000000203'::uuid, 'polresta_bandung@ep.id', 'polres', 'Polresta Bandung'),
      ('00000000-0000-0000-0000-000000000204'::uuid, 'polresta_bogor_kota@ep.id', 'polres', 'Polresta Bogor Kota'),
      ('00000000-0000-0000-0000-000000000205'::uuid, 'polresta_cirebon@ep.id', 'polres', 'Polresta Cirebon'),
      ('00000000-0000-0000-0000-000000000206'::uuid, 'polresta_karawang@ep.id', 'polres', 'Polresta Karawang'),
      ('00000000-0000-0000-0000-000000000207'::uuid, 'polresta_sukabumi@ep.id', 'polres', 'Polresta Sukabumi'),
      ('00000000-0000-0000-0000-000000000208'::uuid, 'polres_cimahi@ep.id', 'polres', 'Polres Cimahi'),
      ('00000000-0000-0000-0000-000000000209'::uuid, 'polres_banjar@ep.id', 'polres', 'Polres Banjar'),
      ('00000000-0000-0000-0000-00000000020a'::uuid, 'kanit_paminal_banjar_kota@ep.id', 'polres', 'Polres Banjar'),
      ('00000000-0000-0000-0000-00000000020b'::uuid, 'polres_bogor@ep.id', 'polres', 'Polres Bogor'),
      ('00000000-0000-0000-0000-00000000020c'::uuid, 'kaur_yanduan_bogor@ep.id', 'polres', 'Polres Bogor'),
      ('00000000-0000-0000-0000-00000000020d'::uuid, 'polres_cianjur@ep.id', 'polres', 'Polres Cianjur'),
      ('00000000-0000-0000-0000-00000000020e'::uuid, 'polres_ciamis@ep.id', 'polres', 'Polres Ciamis'),
      ('00000000-0000-0000-0000-00000000020f'::uuid, 'polres_cirebon_kota@ep.id', 'polres', 'Polres Cirebon Kota'),
      ('00000000-0000-0000-0000-000000000210'::uuid, 'polres_garut@ep.id', 'polres', 'Polres Garut'),
      ('00000000-0000-0000-0000-000000000211'::uuid, 'polres_indramayu@ep.id', 'polres', 'Polres Indramayu'),
      ('00000000-0000-0000-0000-000000000212'::uuid, 'polres_kuningan@ep.id', 'polres', 'Polres Kuningan'),
      ('00000000-0000-0000-0000-000000000213'::uuid, 'polres_majalengka@ep.id', 'polres', 'Polres Majalengka'),
      ('00000000-0000-0000-0000-000000000214'::uuid, 'polres_pangandaran@ep.id', 'polres', 'Polres Pangandaran'),
      ('00000000-0000-0000-0000-000000000215'::uuid, 'polres_purwakarta@ep.id', 'polres', 'Polres Purwakarta'),
      ('00000000-0000-0000-0000-000000000216'::uuid, 'polres_subang@ep.id', 'polres', 'Polres Subang'),
      ('00000000-0000-0000-0000-000000000217'::uuid, 'polres_sukabumi@ep.id', 'polres', 'Polres Sukabumi'),
      ('00000000-0000-0000-0000-000000000218'::uuid, 'polres_sukabumi_kota@ep.id', 'polres', 'Polres Sukabumi Kota'),
      ('00000000-0000-0000-0000-000000000219'::uuid, 'polres_sumedang@ep.id', 'polres', 'Polres Sumedang'),
      ('00000000-0000-0000-0000-00000000021a'::uuid, 'polres_tasikmalaya@ep.id', 'polres', 'Polres Tasikmalaya'),
      ('00000000-0000-0000-0000-00000000021b'::uuid, 'polres_tasikmalaya_kota@ep.id', 'polres', 'Polres Tasikmalaya Kota')
  loop
    -- Password default sama untuk semua user
    pw := 'ePropamJabar!';
    pw_hash := crypt(pw, gen_salt('bf'));

    insert into auth.users (
      id, instance_id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_user_meta_data, raw_app_meta_data,
      is_sso_user, is_anonymous,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) values (
      rec.column1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
      rec.column2, pw_hash, now(), now(), now(),
      '{"provider":"email"}', '{"provider":"email"}',
      false, false, '', '', '', ''
    ) on conflict (id) do nothing;

    update public.profiles
      set role = rec.column3, unit_name = rec.column4
      where id = rec.column1;

    -- Print password so admin can record it
    raise notice 'Account: % — password: %', rec.column2, pw;
  end loop;
end $$;
