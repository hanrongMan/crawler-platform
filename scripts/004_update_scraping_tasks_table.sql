-- Update scraping_tasks table to reference auth.users properly
ALTER TABLE public.scraping_tasks 
ALTER COLUMN user_id TYPE UUID USING user_id::UUID;

-- Add foreign key constraint to scraping_tasks
ALTER TABLE public.scraping_tasks 
ADD CONSTRAINT fk_scraping_tasks_user_id 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add RLS to scraping_tasks table
ALTER TABLE public.scraping_tasks ENABLE ROW LEVEL SECURITY;

-- RLS Policies for scraping_tasks
CREATE POLICY "Users can view own scraping tasks" ON public.scraping_tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own scraping tasks" ON public.scraping_tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own scraping tasks" ON public.scraping_tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all scraping tasks" ON public.scraping_tasks
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles 
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_scraping_tasks_user_id ON public.scraping_tasks(user_id);
