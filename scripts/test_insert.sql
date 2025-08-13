-- 测试插入user_scraping_configs表

-- 1. 检查表是否存在
SELECT EXISTS (
   SELECT FROM information_schema.tables 
   WHERE table_schema = 'public' 
   AND table_name = 'user_scraping_configs'
) as table_exists;

-- 2. 检查约束是否存在
SELECT 
    constraint_name, 
    constraint_type, 
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_scraping_configs';

-- 3. 测试插入操作（使用一个测试用户ID）
-- 注意：这里使用一个示例用户ID，实际使用时需要替换为真实的用户ID
INSERT INTO user_scraping_configs (
    user_id,
    config_name,
    target_url,
    website_type,
    supabase_url,
    supabase_key,
    is_default
) VALUES (
    'c7c202f0-512c-4222-8adf-2849c0a2272b',
    'Test Config',
    'https://example.com',
    'custom',
    'https://test.supabase.co',
    'test-key',
    true
) ON CONFLICT (user_id, is_default) WHERE is_default = true 
DO UPDATE SET
    config_name = EXCLUDED.config_name,
    target_url = EXCLUDED.target_url,
    website_type = EXCLUDED.website_type,
    supabase_url = EXCLUDED.supabase_url,
    supabase_key = EXCLUDED.supabase_key,
    updated_at = NOW();

-- 4. 验证插入结果
SELECT * FROM user_scraping_configs 
WHERE user_id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';

-- 5. 清理测试数据
DELETE FROM user_scraping_configs 
WHERE user_id = 'c7c202f0-512c-4222-8adf-2849c0a2272b';
