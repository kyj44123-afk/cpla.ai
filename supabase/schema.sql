-- Enable pgvector
create extension if not exists vector;

-- 1) 견적 요청 / 상담 예약 저장 테이블
create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  data jsonb not null,
  ip text null,
  user_agent text null,
  created_at timestamptz not null default now()
);

create index if not exists requests_created_at_idx on public.requests (created_at desc);
create index if not exists requests_type_idx on public.requests (type);

-- 2) 문서 원문(업로드 단위)
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  source text null,
  filename text not null,
  mime_type text null,
  content text not null,
  created_at timestamptz not null default now()
);

create index if not exists documents_created_at_idx on public.documents (created_at desc);

-- 3) 문서 청크(벡터 검색 대상)
-- text-embedding-3-small = 1536 dims
create table if not exists public.document_chunks (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents(id) on delete cascade,
  chunk_index int not null,
  content text not null,
  embedding vector(1536) null,
  created_at timestamptz not null default now(),
  unique(document_id, chunk_index)
);

create index if not exists document_chunks_document_id_idx on public.document_chunks (document_id);
create index if not exists document_chunks_embedding_idx on public.document_chunks using ivfflat (embedding vector_cosine_ops) with (lists = 100);

-- Optional: similarity search helper function
create or replace function public.match_document_chunks (
  query_embedding vector(1536),
  match_count int default 10
)
returns table (
  id uuid,
  document_id uuid,
  chunk_index int,
  content text,
  similarity float
)
language sql stable
as $$
  select
    dc.id,
    dc.document_id,
    dc.chunk_index,
    dc.content,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  where dc.embedding is not null
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;

