-- 最简单的user_profiles表RLS策略，完全避免递归

-- 1. 删除所有现有的RLS策略
DROP POLICY IF EXISTS "Users can view own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.user_profiles;

-- 2. 创建最基本的RLS策略，只允许用户访问自己的数据
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- 3. 暂时禁用RLS进行测试（如果需要）
-- ALTER TABLE public.user_profiles DISABLE ROW LEVEL SECURITY;

-- 4. 验证策略
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'user_profiles'
ORDER BY policyname;

-- 5. 检查RLS是否启用
SELECT 
    schemaname, 
    tablename, 
    rowsecurity 
FROM pg_tables 
WHERE tablename = 'user_profiles';

-- 6. 测试基本查询
-- 这个查询应该能正常工作
SELECT COUNT(*) as total_profiles FROM public.user_profiles;

-- 7. 检查当前用户是否存在
SELECT 
    id, 
    email, 
    full_name, 
    status, 
    role 
FROM public.user_profiles 
WHERE id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';
