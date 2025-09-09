-- Supabase Security Fixes
-- Run this to fix search_path warnings and clean up duplicate policies

-- 1. Drop all existing policies (to avoid duplicates)
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

DROP POLICY IF EXISTS "Users can view their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can insert their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can update their own categories" ON public.categories;
DROP POLICY IF EXISTS "Users can delete their own categories" ON public.categories;

DROP POLICY IF EXISTS "Users can view their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can insert their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can update their own budgets" ON public.budgets;
DROP POLICY IF EXISTS "Users can delete their own budgets" ON public.budgets;

DROP POLICY IF EXISTS "Users can view their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can insert their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can update their own transactions" ON public.transactions;
DROP POLICY IF EXISTS "Users can delete their own transactions" ON public.transactions;

DROP POLICY IF EXISTS "Users can view their own insights" ON public.insights;
DROP POLICY IF EXISTS "Users can insert their own insights" ON public.insights;
DROP POLICY IF EXISTS "Users can update their own insights" ON public.insights;
DROP POLICY IF EXISTS "Users can delete their own insights" ON public.insights;

-- 2. Recreate all RLS policies
-- User Profiles policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Categories policies
CREATE POLICY "Users can view their own categories"
  ON public.categories FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own categories"
  ON public.categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own categories"
  ON public.categories FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own categories"
  ON public.categories FOR DELETE
  USING (auth.uid() = user_id);

-- Budgets policies
CREATE POLICY "Users can view their own budgets"
  ON public.budgets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own budgets"
  ON public.budgets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own budgets"
  ON public.budgets FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own budgets"
  ON public.budgets FOR DELETE
  USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions"
  ON public.transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions"
  ON public.transactions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions"
  ON public.transactions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions"
  ON public.transactions FOR DELETE
  USING (auth.uid() = user_id);

-- Insights policies
CREATE POLICY "Users can view their own insights"
  ON public.insights FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own insights"
  ON public.insights FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own insights"
  ON public.insights FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own insights"
  ON public.insights FOR DELETE
  USING (auth.uid() = user_id);

-- 3. Fix all functions with proper search_path (security definer)
-- Drop existing functions and recreate with proper security

DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_budget_spent() CASCADE;
DROP FUNCTION IF EXISTS public.generate_spending_insights() CASCADE;
DROP FUNCTION IF EXISTS public.create_default_categories(uuid) CASCADE;

-- Function to automatically update updated_at column (SECURITY DEFINER with search_path)
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

-- Function to automatically create user profile on signup (SECURITY DEFINER with search_path)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public, auth
LANGUAGE plpgsql
AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', NEW.email, 'user_' || substr(NEW.id::text, 1, 8))
  );
  
  -- Create default categories and budgets
  PERFORM public.create_default_categories(NEW.id);
  
  RETURN NEW;
END;
$$;

-- Function to update budget spent when transaction is created/updated/deleted (SECURITY DEFINER with search_path)
CREATE OR REPLACE FUNCTION public.update_budget_spent()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  budget_record RECORD;
BEGIN
  -- Handle INSERT and UPDATE
  IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
    -- Only process expense transactions
    IF NEW.type = 'expense' THEN
      -- Find or create budget for this category
      SELECT * INTO budget_record 
      FROM public.budgets 
      WHERE user_id = NEW.user_id AND category = NEW.category;
      
      IF NOT FOUND THEN
        -- Create budget with 0 limit if it doesn't exist
        INSERT INTO public.budgets (user_id, category, monthly_limit, current_spent)
        VALUES (NEW.user_id, NEW.category, 0.00, NEW.amount);
      ELSE
        -- Update existing budget
        IF TG_OP = 'INSERT' THEN
          UPDATE public.budgets 
          SET current_spent = current_spent + NEW.amount
          WHERE user_id = NEW.user_id AND category = NEW.category;
        ELSIF TG_OP = 'UPDATE' THEN
          -- Adjust by the difference
          UPDATE public.budgets 
          SET current_spent = current_spent - OLD.amount + NEW.amount
          WHERE user_id = NEW.user_id AND category = NEW.category;
        END IF;
      END IF;
    END IF;
  END IF;
  
  -- Handle DELETE
  IF TG_OP = 'DELETE' THEN
    IF OLD.type = 'expense' THEN
      UPDATE public.budgets 
      SET current_spent = GREATEST(0, current_spent - OLD.amount)
      WHERE user_id = OLD.user_id AND category = OLD.category;
    END IF;
    RETURN OLD;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Function to generate insights based on spending patterns (SECURITY DEFINER with search_path)
CREATE OR REPLACE FUNCTION public.generate_spending_insights()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  budget_record RECORD;
  spent_percentage NUMERIC;
BEGIN
  -- Only process expense transactions
  IF NEW.type = 'expense' THEN
    -- Get budget for this category
    SELECT * INTO budget_record 
    FROM public.budgets 
    WHERE user_id = NEW.user_id AND category = NEW.category;
    
    IF FOUND AND budget_record.monthly_limit > 0 THEN
      spent_percentage := (budget_record.current_spent / budget_record.monthly_limit) * 100;
      
      -- Generate warning if budget exceeded
      IF spent_percentage > 100 THEN
        INSERT INTO public.insights (user_id, type, title, message, category, is_read)
        VALUES (
          NEW.user_id,
          'warning',
          'Budget Exceeded',
          'You''ve exceeded your ' || NEW.category || ' budget by DH' ||
          to_char(budget_record.current_spent - budget_record.monthly_limit, 'FM999999990.00') ||
          ' this month.',
          NEW.category,
          false
        );
      -- Generate alert if 80% of budget used
      ELSIF spent_percentage > 80 THEN
        INSERT INTO public.insights (user_id, type, title, message, category, is_read)
        VALUES (
          NEW.user_id,
          'warning',
          'Budget Alert',
          'You''ve used ' || to_char(spent_percentage, 'FM999990') || '% of your ' || NEW.category || ' budget this month.',
          NEW.category,
          false
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Insert default categories for new users (SECURITY DEFINER with search_path)
CREATE OR REPLACE FUNCTION public.create_default_categories(user_uuid UUID)
RETURNS VOID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  -- Default expense categories
  INSERT INTO public.categories (user_id, name, type, color, icon) VALUES
  (user_uuid, 'Food & Dining', 'expense', '#F97316', 'Utensils'),
  (user_uuid, 'Transportation', 'expense', '#3B82F6', 'Car'),
  (user_uuid, 'Entertainment', 'expense', '#A855F7', 'Gamepad2'),
  (user_uuid, 'Shopping', 'expense', '#F43F5E', 'ShoppingBag'),
  (user_uuid, 'Bills & Utilities', 'expense', '#10B981', 'Home'),
  (user_uuid, 'Income', 'income', '#0EA5E9', 'Wallet');
  
  -- Default budgets for expense categories
  INSERT INTO public.budgets (user_id, category, monthly_limit, current_spent) VALUES
  (user_uuid, 'Food & Dining', 600.00, 0.00),
  (user_uuid, 'Transportation', 400.00, 0.00),
  (user_uuid, 'Entertainment', 300.00, 0.00),
  (user_uuid, 'Shopping', 500.00, 0.00),
  (user_uuid, 'Bills & Utilities', 800.00, 0.00);
END;
$$;

-- Recreate all triggers
DROP TRIGGER IF EXISTS handle_updated_at_user_profiles ON public.user_profiles;
DROP TRIGGER IF EXISTS handle_updated_at_categories ON public.categories;
DROP TRIGGER IF EXISTS handle_updated_at_budgets ON public.budgets;
DROP TRIGGER IF EXISTS handle_updated_at_transactions ON public.transactions;
DROP TRIGGER IF EXISTS handle_updated_at_insights ON public.insights;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS update_budget_spent_trigger ON public.transactions;
DROP TRIGGER IF EXISTS generate_spending_insights_trigger ON public.transactions;

-- Create updated_at triggers for all tables
CREATE TRIGGER handle_updated_at_user_profiles
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_categories
  BEFORE UPDATE ON public.categories
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_budgets
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_transactions
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

CREATE TRIGGER handle_updated_at_insights
  BEFORE UPDATE ON public.insights
  FOR EACH ROW EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Trigger to update budget spent
CREATE TRIGGER update_budget_spent_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.update_budget_spent();

-- Trigger to generate insights
CREATE TRIGGER generate_spending_insights_trigger
  AFTER INSERT ON public.transactions
  FOR EACH ROW EXECUTE PROCEDURE public.generate_spending_insights();
