-- ============================================================================
-- NITO LIVE - o Helper como download proprio.
--
-- SO ACRESCENTA duas colunas. Nao apaga, nao altera coluna existente, nao
-- mexe em permissao. As versoes ja publicadas continuam iguais, com as duas
-- colunas novas em branco.
-- ============================================================================
alter table public.extensao_versoes
  add column if not exists helper_url   text,
  add column if not exists helper_bytes bigint;

comment on column public.extensao_versoes.helper_url is
  'Instalador do NITO Native Helper que acompanha esta versao. Em branco = herda o ultimo publicado.';

-- Conferencia: as duas colunas tem que aparecer.
select column_name, data_type
  from information_schema.columns
 where table_schema = 'public'
   and table_name   = 'extensao_versoes'
   and column_name in ('helper_url', 'helper_bytes')
 order by column_name;
