-- Add user_scope column to card_layout_config
-- user_scope: 'leadership' = Kasubbid/Kasubbag, 'unit' = regular unit member, NULL = all
alter table public.card_layout_config
  add column if not exists user_scope text;

-- Drop old unique constraint, add new one with user_scope
alter table public.card_layout_config
  drop constraint if exists card_layout_config_role_card_id_key;

alter table public.card_layout_config
  add constraint card_layout_config_role_card_id_key unique (role, card_id, user_scope);
