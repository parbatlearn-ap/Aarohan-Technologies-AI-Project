-- Used by the Policy Intelligence engine (HTTP POST /rest/v1/rpc/match_policy_chunks)
create or replace function public.match_policy_chunks(query_embedding text, match_count int default 5)
returns table (document_id text, section text, chunk_text text, distance double precision)
language sql stable security definer set search_path = public, extensions
as $$
  select c.document_id, c.section, c.chunk_text, (c.embedding <=> query_embedding::vector) as distance
  from public.policy_chunks c
  order by c.embedding <=> query_embedding::vector
  limit least(greatest(match_count, 1), 10);
$$;
revoke all on function public.match_policy_chunks(text, int) from public;
grant execute on function public.match_policy_chunks(text, int) to anon, authenticated;
