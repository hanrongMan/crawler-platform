-- 修复用户触发器，确保新用户注册时自动创建profile

-- 1. 检查触发器是否存在
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 2. 检查触发器函数是否存在
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- 3. 重新创建触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
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
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', '用户'),
    'approved',
    'user',
    50,
    1000,
    NOW(),
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    -- 如果profile已存在，忽略错误
    RETURN NEW;
  WHEN OTHERS THEN
    -- 记录其他错误但不阻止用户创建
    RAISE WARNING 'Failed to create user profile for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 删除并重新创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. 验证触发器
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 6. 为现有用户创建缺失的profiles
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
    u.created_at,
    NOW()
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
);

-- 7. 验证所有用户都有profile
SELECT 
    'auth.users count' as table_name,
    COUNT(*) as count
FROM auth.users
UNION ALL
SELECT 
    'user_profiles count' as table_name,
    COUNT(*) as count
FROM public.user_profiles;

-- 8. 检查是否有用户没有profile
SELECT 
    u.id,
    u.email,
    u.created_at
FROM auth.users u
WHERE NOT EXISTS (
    SELECT 1 FROM public.user_profiles p WHERE p.id = u.id
);
