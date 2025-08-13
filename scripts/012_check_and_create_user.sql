-- 检查用户是否存在并创建用户profile

-- 1. 检查auth.users表中是否存在该用户
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    raw_user_meta_data
FROM auth.users 
WHERE id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';

-- 2. 检查user_profiles表中是否存在该用户的profile
SELECT 
    id,
    email,
    full_name,
    status,
    role,
    created_at
FROM public.user_profiles 
WHERE id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';

-- 3. 如果auth.users中存在用户但user_profiles中不存在，则创建profile
INSERT INTO public.user_profiles (
    id,
    email,
    full_name,
    status,
    role,
    daily_limit,
    monthly_limit,
    approved_at,
    created_at,
    updated_at
)
SELECT 
    u.id,
    u.email,
    COALESCE(u.raw_user_meta_data->>'full_name', '用户'),
    'approved',
    'user',
    50,
    1000,
    NOW(),
    NOW(),
    NOW()
FROM auth.users u
WHERE u.id = 'c7c202f0-512c-4222-8adf-2849c0a2272b'
AND NOT EXISTS (
    SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
);

-- 4. 验证profile是否创建成功
SELECT 
    id,
    email,
    full_name,
    status,
    role,
    created_at
FROM public.user_profiles 
WHERE id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';

-- 5. 检查所有用户profiles
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

-- 6. 测试查询（模拟应用中的查询）
SELECT status 
FROM public.user_profiles 
WHERE id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';
