-- 插入默认的爬取配置
INSERT INTO scraping_configs (website_name, display_name, base_url, selectors, pagination_config, rate_limit_ms, max_pages) VALUES
(
  'tencent',
  '腾讯招聘',
  'https://join.qq.com',
  '{
    "jobList": ".job-list-item",
    "title": ".job-title",
    "department": ".job-department",
    "location": ".job-location",
    "experience": ".job-experience",
    "description": ".job-description",
    "requirements": ".job-requirements",
    "publishTime": ".publish-time"
  }'::jsonb,
  '{
    "nextPageSelector": ".next-page",
    "pageParamName": "page",
    "startPage": 1
  }'::jsonb,
  2000,
  20
),
(
  'bytedance',
  '字节跳动招聘',
  'https://jobs.bytedance.com',
  '{
    "jobList": ".job-card",
    "title": ".job-title",
    "department": ".job-department",
    "location": ".job-location",
    "experience": ".job-experience",
    "salary": ".job-salary",
    "description": ".job-description",
    "requirements": ".job-requirements",
    "skills": ".job-tags .tag"
  }'::jsonb,
  '{
    "nextPageSelector": ".pagination .next",
    "pageParamName": "page",
    "startPage": 1
  }'::jsonb,
  1500,
  15
),
(
  'alibaba',
  '阿里招聘',
  'https://talent-holding.alibaba.com',
  '{
    "jobList": ".position-item",
    "title": ".position-title",
    "department": ".position-department",
    "location": ".position-location",
    "experience": ".position-experience",
    "description": ".position-description",
    "requirements": ".position-requirements",
    "benefits": ".position-benefits"
  }'::jsonb,
  '{
    "nextPageSelector": ".pagination .next",
    "pageParamName": "currentPage",
    "startPage": 1
  }'::jsonb,
  2500,
  25
)
ON CONFLICT (website_name) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  base_url = EXCLUDED.base_url,
  selectors = EXCLUDED.selectors,
  pagination_config = EXCLUDED.pagination_config,
  rate_limit_ms = EXCLUDED.rate_limit_ms,
  max_pages = EXCLUDED.max_pages,
  updated_at = NOW();
