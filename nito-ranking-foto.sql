-- ============================================================================
-- NITO LIVE - a foto tambem no ranking.
--
-- SO SUBSTITUI a funcao do ranking para ela devolver o avatar_url junto.
-- Nao apaga, nao altera tabela, nao mexe em permissao.
-- ============================================================================
drop function if exists public.fn_ranking_afiliados(integer, timestamptz);

create or replace function public.fn_ranking_afiliados(
  p_limite integer default 10,
  p_desde  timestamptz default null
)
returns table (
  user_id           uuid,
  nome              text,
  username          text,
  avatar_url        text,
  nivel             integer,
  xp                integer,
  vendas            bigint,
  comissao_centavos bigint
)
language sql
security definer
set search_path = public
as $$
  select p.id, p.nome, p.username, p.avatar_url, p.nivel,
         coalesce(sum(av.xp), 0)::integer                  as xp,
         count(*) filter (where av.sinal > 0)              as vendas,
         coalesce(sum(av.comissao_centavos * av.sinal), 0) as comissao_centavos
    from public.perfis p
    join public.afiliado_vendas av
      on av.user_id = p.id
     and (p_desde is null or av.criado_em >= p_desde)
   where coalesce(p.papel, 'membro') not in ('fundador', 'moderador')
   group by p.id, p.nome, p.username, p.avatar_url, p.nivel
  having coalesce(sum(av.xp), 0) > 0
   order by coalesce(sum(av.xp), 0) desc
   limit greatest(1, least(coalesce(p_limite, 10), 50));
$$;

grant execute on function public.fn_ranking_afiliados(integer, timestamptz) to authenticated;

select 'funcao fn_ranking_afiliados com foto' as item,
       count(*)::text || ' (esperado 1)' as resultado
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'fn_ranking_afiliados';
