-- 临时禁用RLS进行测试

-- 1. 禁用user_profiles表的RLS
ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 2. 验证RLS已禁用
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 3. 测试查询是否正常工作
SELECT 
    id, 
    email, 
    full_name, 
    status, 
    role 
FROM public.user_profiles 
WHERE id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';

-- 4. 检查所有用户
SELECT 
    id, 
    email, 
    full_name, 
    status, 
    role,
    created_at
FROM public.user_profiles 
ORDER BY created_at DESC
LIMIT 10;

-- 5. 如果需要重新启用RLS，运行以下命令：
-- ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
-- 然后运行 scripts/010_simple_user_profiles_rls.sql
