alter table public.pengaduan
add column if not exists disposisi_submitted_at timestamptz,
add column if not exists disposisi_submitted_by text,
add column if not exists kabid_approval_status text,
add column if not exists kabid_approved_at timestamptz,
add column if not exists kabid_approved_by text,
add column if not exists kabid_catatan text,
add column if not exists kabid_rejected_reason text,
add column if not exists unit_status text,
add column if not exists unit_progress text,
add column if not exists unit_started_at timestamptz,
add column if not exists unit_completed_at timestamptz,
add column if not exists unit_officer text;

NOTIFY pgrst, 'reload schema';
