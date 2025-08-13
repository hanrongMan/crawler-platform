-- 创建用户爬虫配置表
CREATE TABLE IF NOT EXISTS user_scraping_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  config_name VARCHAR(100) NOT NULL,
  target_url TEXT NOT NULL,
  website_type VARCHAR(50) NOT NULL,
  supabase_url TEXT NOT NULL,
  supabase_key TEXT NOT NULL,
  api_config JSONB, -- 存储API配置信息
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, config_name)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_scraping_configs_user_id ON user_scraping_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_scraping_configs_default ON user_scraping_configs(user_id, is_default) WHERE is_default = true;

-- 启用行级安全策略
ALTER TABLE user_scraping_configs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own configs" ON user_scraping_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own configs" ON user_scraping_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own configs" ON user_scraping_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own configs" ON user_scraping_configs
  FOR DELETE USING (auth.uid() = user_id);

-- 创建触发器来更新 updated_at
CREATE OR REPLACE FUNCTION update_user_scraping_configs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_scraping_configs_updated_at
  BEFORE UPDATE ON user_scraping_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_user_scraping_configs_updated_at();
