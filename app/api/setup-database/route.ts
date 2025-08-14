import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { supabaseUrl, supabaseKey, action } = await request.json()

    if (!supabaseUrl || !supabaseKey || !action) {
      return NextResponse.json(
        { success: false, error: "缺少必要参数" },
        { status: 400 }
      )
    }

    const rpcCreateTablesSQL = `
-- 一次性在 Supabase SQL 编辑器中执行本脚本，用于创建受限RPC以远程建表
create extension if not exists pgcrypto;

create or replace function public.create_required_tables()
returns void
language plpgsql
security definer
as $$
begin
  -- jobs
  execute $$create table if not exists public.jobs (
    id uuid primary key default gen_random_uuid(),
    company_id uuid null,
    title text not null,
    department text null,
    job_type text null,
    experience_level text null,
    location text null,
    salary_min numeric null,
    salary_max numeric null,
    salary_currency text null,
    salary_period text null,
    description text null,
    requirements text null,
    benefits text null,
    skills jsonb null,
    status text null,
    urgency_level text null,
    contact_email text null,
    contact_person text null,
    original_url text not null,
    source_website text not null,
    external_job_id text null,
    scraped_at timestamptz null,
    last_updated_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );$$;

  execute $$create index if not exists idx_jobs_source_website on public.jobs(source_website);$$;
  execute $$create index if not exists idx_jobs_created_at on public.jobs(created_at desc);$$;

  -- scraping_tasks
  execute $$create table if not exists public.scraping_tasks (
    id uuid primary key default gen_random_uuid(),
    user_id uuid null,
    target_url text not null,
    source_website text not null,
    supabase_url text not null,
    supabase_key text not null,
    status text null,
    progress int null,
    total_jobs_found int null,
    jobs_scraped int null,
    jobs_updated int null,
    jobs_failed int null,
    error_message text null,
    error_details jsonb null,
    started_at timestamptz null,
    completed_at timestamptz null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );$$;

  -- user_scraping_configs
  execute $$create table if not exists public.user_scraping_configs (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null,
    config_name varchar not null,
    target_url text not null,
    website_type varchar not null,
    supabase_url text not null,
    supabase_key text not null,
    api_config jsonb null,
    is_default boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  );$$;

  execute $$create unique index if not exists uq_user_default on public.user_scraping_configs(user_id, is_default) where is_default = true;$$;

  -- scraping_configs（仅建表，不插默认数据）
  execute $$create table if not exists public.scraping_configs (
    id uuid default gen_random_uuid() primary key,
    website_name varchar(100) not null unique,
    display_name varchar(100) not null,
    base_url text not null,
    selectors jsonb not null,
    pagination_config jsonb,
    rate_limit_ms integer default 1000,
    max_pages integer default 10,
    is_active boolean default true,
    created_at timestamptz default now(),
    updated_at timestamptz default now()
  );$$;

  -- 开启RLS（策略可按需调整）
  execute $$alter table public.jobs enable row level security;$$;
  execute $$alter table public.scraping_tasks enable row level security;$$;
  execute $$alter table public.user_scraping_configs enable row level security;$$;
  execute $$alter table public.scraping_configs enable row level security;$$;

  -- 基础策略，仅示例用途，可按需收紧
  execute $$create policy if not exists jobs_read_all on public.jobs for select using (true);$$;
  execute $$create policy if not exists jobs_write_all on public.jobs for insert with check (true);$$;
  execute $$create policy if not exists tasks_read_all on public.scraping_tasks for select using (true);$$;
  execute $$create policy if not exists tasks_write_all on public.scraping_tasks for insert with check (true);$$;
  execute $$create policy if not exists cfg_read_own on public.user_scraping_configs for select using (auth.uid() = user_id);$$;
  execute $$create policy if not exists cfg_write_own on public.user_scraping_configs for insert with check (auth.uid() = user_id);$$;
end;
$$;

-- 仅允许匿名/登录用户执行（函数为definer权限，内部只跑白名单DDL，安全）
revoke all on function public.create_required_tables() from public;
grant execute on function public.create_required_tables() to anon, authenticated;
`;

    const rpcSeedDataSQL = `
create or replace function public.seed_default_configs()
returns void
language plpgsql
security definer
as $$
begin
  -- 若不存在则插入默认网站配置（示例：tencent/bytedance）
  insert into public.scraping_configs (website_name, display_name, base_url, selectors, is_active)
  values
    ('bytedance', '字节跳动招聘', 'https://jobs.bytedance.com', '{}'::jsonb, true)
  on conflict (website_name) do nothing;

  insert into public.scraping_configs (website_name, display_name, base_url, selectors, is_active)
  values
    ('tencent', '腾讯招聘', 'https://join.qq.com/post.html?page=1', '{}'::jsonb, true)
  on conflict (website_name) do nothing;
end;
$$;

revoke all on function public.seed_default_configs() from public;
grant execute on function public.seed_default_configs() to anon, authenticated;
`;

    const callRpc = async (fnName: string) => {
      const res = await fetch(`${supabaseUrl}/rest/v1/rpc/${fnName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        },
        body: JSON.stringify({}),
      })
      return res
    }

    if (action === 'createTables') {
      const res = await callRpc('create_required_tables')
      if (res.ok) {
        return NextResponse.json({ success: true, message: '数据表创建成功' })
      }
      // 函数不存在或无权限时，返回需要在SQL编辑器执行的脚本
      return NextResponse.json({
        success: false,
        error: '远程建表失败。请先在 Supabase SQL 编辑器中执行下方脚本以创建RPC函数，然后再点“创建表”。',
        sql: rpcCreateTablesSQL,
      }, { status: 400 })
    }

    if (action === 'initializeData') {
      const res = await callRpc('seed_default_configs')
      if (res.ok) {
        return NextResponse.json({ success: true, message: '数据初始化成功' })
      }
      return NextResponse.json({
        success: false,
        error: '远程初始化失败。请先在 Supabase SQL 编辑器中执行下方脚本以创建初始化RPC函数，然后再点“初始化数据”。',
        sql: rpcSeedDataSQL,
      }, { status: 400 })
    }

    return NextResponse.json(
      { success: false, error: '不支持的操作类型' },
      { status: 400 }
    )
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : '数据库设置失败' },
      { status: 500 }
    )
  }
}
