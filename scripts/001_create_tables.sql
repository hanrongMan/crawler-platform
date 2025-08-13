-- 创建公司信息表
CREATE TABLE IF NOT EXISTS companies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  logo_url TEXT,
  website_url TEXT,
  industry VARCHAR(100),
  company_size VARCHAR(50),
  location VARCHAR(255),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建招聘职位表
CREATE TABLE IF NOT EXISTS jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  
  -- 基本信息
  title VARCHAR(255) NOT NULL,
  department VARCHAR(100),
  job_type VARCHAR(50), -- 全职/兼职/实习
  experience_level VARCHAR(50), -- 应届生/1-3年/3-5年等
  
  -- 地点和薪资
  location VARCHAR(255),
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency VARCHAR(10) DEFAULT 'CNY',
  salary_period VARCHAR(20) DEFAULT 'monthly', -- monthly/yearly
  
  -- 职位详情
  description TEXT,
  requirements TEXT,
  benefits TEXT,
  
  -- 技能标签
  skills JSONB DEFAULT '[]'::jsonb,
  
  -- 招聘状态
  status VARCHAR(50) DEFAULT 'active', -- active/closed/paused
  urgency_level VARCHAR(20), -- urgent/normal/low
  
  -- 联系方式
  contact_email VARCHAR(255),
  contact_person VARCHAR(100),
  
  -- 原始数据
  original_url TEXT NOT NULL,
  source_website VARCHAR(100) NOT NULL, -- tencent/bytedance/alibaba等
  external_job_id VARCHAR(255), -- 原网站的职位ID
  
  -- 爬取信息
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 索引优化
  UNIQUE(source_website, external_job_id)
);

-- 创建爬取任务表
CREATE TABLE IF NOT EXISTS scraping_tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id VARCHAR(255), -- 用户标识（可以是IP或自定义ID）
  
  -- 任务配置
  target_url TEXT NOT NULL,
  source_website VARCHAR(100) NOT NULL,
  supabase_url TEXT NOT NULL,
  supabase_key TEXT NOT NULL,
  
  -- 任务状态
  status VARCHAR(50) DEFAULT 'pending', -- pending/running/completed/failed
  progress INTEGER DEFAULT 0, -- 0-100
  
  -- 结果统计
  total_jobs_found INTEGER DEFAULT 0,
  jobs_scraped INTEGER DEFAULT 0,
  jobs_updated INTEGER DEFAULT 0,
  jobs_failed INTEGER DEFAULT 0,
  
  -- 错误信息
  error_message TEXT,
  error_details JSONB,
  
  -- 时间记录
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建爬取配置表（用于存储不同网站的爬取规则）
CREATE TABLE IF NOT EXISTS scraping_configs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  website_name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(100) NOT NULL,
  base_url TEXT NOT NULL,
  
  -- 爬取规则配置
  selectors JSONB NOT NULL, -- CSS选择器配置
  pagination_config JSONB, -- 分页配置
  rate_limit_ms INTEGER DEFAULT 1000, -- 请求间隔毫秒
  max_pages INTEGER DEFAULT 10, -- 最大爬取页数
  
  -- 状态
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_jobs_company_id ON jobs(company_id);
CREATE INDEX IF NOT EXISTS idx_jobs_source_website ON jobs(source_website);
CREATE INDEX IF NOT EXISTS idx_jobs_location ON jobs(location);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON jobs(salary_min, salary_max);
CREATE INDEX IF NOT EXISTS idx_scraping_tasks_status ON scraping_tasks(status);
CREATE INDEX IF NOT EXISTS idx_scraping_tasks_user_id ON scraping_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON companies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_jobs_updated_at BEFORE UPDATE ON jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scraping_tasks_updated_at BEFORE UPDATE ON scraping_tasks FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_scraping_configs_updated_at BEFORE UPDATE ON scraping_configs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
