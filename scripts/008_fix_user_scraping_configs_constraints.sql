-- 修复user_scraping_configs表的约束问题

-- 1. 删除现有的表（如果存在）
DROP TABLE IF EXISTS user_scraping_configs CASCADE;

-- 2. 重新创建表
CREATE TABLE user_scraping_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    config_name VARCHAR NOT NULL,
    target_url TEXT NOT NULL DEFAULT '',
    website_type VARCHAR NOT NULL DEFAULT 'custom',
    supabase_url TEXT NOT NULL,
    supabase_key TEXT NOT NULL,
    api_config JSONB,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建唯一约束，确保每个用户只有一个默认配置
ALTER TABLE user_scraping_configs 
ADD CONSTRAINT user_scraping_configs_user_default_unique 
UNIQUE (user_id, is_default) 
WHERE is_default = true;

-- 4. 创建索引以提高查询性能
CREATE INDEX user_scraping_configs_user_id_idx ON user_scraping_configs (user_id);
CREATE INDEX user_scraping_configs_is_default_idx ON user_scraping_configs (is_default);

-- 5. 启用RLS
ALTER TABLE user_scraping_configs ENABLE ROW LEVEL SECURITY;

-- 6. 创建RLS策略
DROP POLICY IF EXISTS "Users can view their own scraping configs" ON user_scraping_configs;
CREATE POLICY "Users can view their own scraping configs" ON user_scraping_configs
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own scraping configs" ON user_scraping_configs;
CREATE POLICY "Users can insert their own scraping configs" ON user_scraping_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own scraping configs" ON user_scraping_configs;
CREATE POLICY "Users can update their own scraping configs" ON user_scraping_configs
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own scraping configs" ON user_scraping_configs;
CREATE POLICY "Users can delete their own scraping configs" ON user_scraping_configs
    FOR DELETE USING (auth.uid() = user_id);

-- 7. 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_scraping_configs_updated_at ON user_scraping_configs;
CREATE TRIGGER update_user_scraping_configs_updated_at 
    BEFORE UPDATE ON user_scraping_configs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- 8. 验证表结构
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'user_scraping_configs'
ORDER BY ordinal_position;

-- 9. 验证约束
SELECT 
    constraint_name, 
    constraint_type, 
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'user_scraping_configs';

-- 10. 验证RLS策略
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual
FROM pg_policies 
WHERE tablename = 'user_scraping_configs';
