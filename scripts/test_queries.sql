-- 测试user_profiles表查询
-- 1. 检查表是否存在
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_profiles'
) as user_profiles_exists;

-- 2. 检查是否有数据
SELECT COUNT(*) as user_profiles_count FROM user_profiles;

-- 3. 检查特定用户的查询
SELECT id, status FROM user_profiles WHERE id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';

-- 测试user_scraping_configs表查询
-- 1. 检查表是否存在
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_scraping_configs'
) as user_scraping_configs_exists;

-- 2. 检查是否有数据
SELECT COUNT(*) as user_scraping_configs_count FROM user_scraping_configs;

-- 3. 检查特定用户的配置
SELECT user_id, config_name, is_default FROM user_scraping_configs 
WHERE user_id = 'c7c202f0-512c-4222-8adf-2849c0a2272b' AND is_default = true;

-- 检查RLS策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies 
WHERE tablename IN ('user_profiles', 'user_scraping_configs');

-- 检查当前用户权限
SELECT current_user, session_user;

-- 检查RLS是否启用
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename IN ('user_profiles', 'user_scraping_configs');
