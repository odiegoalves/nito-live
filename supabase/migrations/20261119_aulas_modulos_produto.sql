-- NITO LIVE - 19/11/2026: trilha de aulas por produto.
-- Aplicado direto no projeto nito-live (yppzbfjzdpjdxlfljohq) pelo SQL Editor.
-- Modulos sem valor continuam na aba Aulas (TikTok); "shopee" vai para a aba Aulas Shopee.
alter table public.aulas_modulos
  add column if not exists produto text check (produto in ('tiktok', 'shopee'));
comment on column public.aulas_modulos.produto is
  'Trilha do modulo: tiktok (aba Aulas) ou shopee (aba Aulas Shopee). Vazio = tiktok.';
notify pgrst, 'reload schema';
