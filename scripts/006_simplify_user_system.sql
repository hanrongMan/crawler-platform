-- 简化用户系统，移除审核相关的复杂逻辑

-- 更新现有用户为已批准状态
UPDATE public.user_profiles 
SET status = 'approved', 
    approved_at = COALESCE(approved_at, NOW())
WHERE status = 'pending';

-- 删除不需要的审核相关表（可选）
-- DROP TABLE IF EXISTS public.user_applications CASCADE;
-- DROP TABLE IF EXISTS public.admin_audit_log CASCADE;

-- 简化用户档案表的触发器，自动批准新用户
CREATE OR REPLACE FUNCTION public.handle_new_user_simple()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, status, role, daily_limit, monthly_limit, approved_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
    'approved', -- 直接设置为已批准
    'user',
    50,
    1000,
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_simple();
