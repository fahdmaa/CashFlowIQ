-- CashFlowIQ Supabase Database Schema
-- This schema migrates from PocketBase to Supabase with proper RLS policies

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Users table (handled by Supabase Auth, but we can add profile extensions)
create table if not exists public.user_profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Categories table
create table if not exists public.categories (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null check (type in ('income', 'expense')),
  color text not null,
  icon text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, name)
);

-- Budgets table
create table if not exists public.budgets (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  category text not null,
  monthly_limit decimal(12,2) not null,
  current_spent decimal(12,2) default 0.00 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, category)
);

-- Transactions table
create table if not exists public.transactions (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  amount decimal(12,2) not null,
  description text not null,
  category text not null,
  type text not null check (type in ('income', 'expense')),
  date timestamp with time zone not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Insights table
create table if not exists public.insights (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('warning', 'success', 'info')),
  title text not null,
  message text not null,
  category text,
  is_read boolean default false not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create indexes for better performance
create index if not exists idx_categories_user_id on public.categories(user_id);
create index if not exists idx_categories_user_type on public.categories(user_id, type);
create index if not exists idx_budgets_user_id on public.budgets(user_id);
create index if not exists idx_budgets_user_category on public.budgets(user_id, category);
create index if not exists idx_transactions_user_id on public.transactions(user_id);
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_user_category on public.transactions(user_id, category);
create index if not exists idx_transactions_date_type on public.transactions(date, type);
create index if not exists idx_insights_user_id on public.insights(user_id);
create index if not exists idx_insights_user_read on public.insights(user_id, is_read);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
alter table public.user_profiles enable row level security;
alter table public.categories enable row level security;
alter table public.budgets enable row level security;
alter table public.transactions enable row level security;
alter table public.insights enable row level security;

-- User Profiles policies
create policy "Users can view their own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.user_profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- Categories policies
create policy "Users can view their own categories"
  on public.categories for select
  using (auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id);

-- Budgets policies
create policy "Users can view their own budgets"
  on public.budgets for select
  using (auth.uid() = user_id);

create policy "Users can insert their own budgets"
  on public.budgets for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own budgets"
  on public.budgets for update
  using (auth.uid() = user_id);

create policy "Users can delete their own budgets"
  on public.budgets for delete
  using (auth.uid() = user_id);

-- Transactions policies
create policy "Users can view their own transactions"
  on public.transactions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own transactions"
  on public.transactions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own transactions"
  on public.transactions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own transactions"
  on public.transactions for delete
  using (auth.uid() = user_id);

-- Insights policies
create policy "Users can view their own insights"
  on public.insights for select
  using (auth.uid() = user_id);

create policy "Users can insert their own insights"
  on public.insights for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own insights"
  on public.insights for update
  using (auth.uid() = user_id);

create policy "Users can delete their own insights"
  on public.insights for delete
  using (auth.uid() = user_id);

-- Functions and Triggers

-- Function to automatically update updated_at column
create or replace function public.handle_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create updated_at triggers for all tables
create trigger handle_updated_at_user_profiles
  before update on public.user_profiles
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_categories
  before update on public.categories
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_budgets
  before update on public.budgets
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_transactions
  before update on public.transactions
  for each row execute procedure public.handle_updated_at();

create trigger handle_updated_at_insights
  before update on public.insights
  for each row execute procedure public.handle_updated_at();

-- Function to automatically create user profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.email, 'user_' || substr(new.id::text, 1, 8))
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger to create profile when user signs up
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update budget spent when transaction is created/updated/deleted
create or replace function public.update_budget_spent()
returns trigger as $$
declare
  budget_record record;
begin
  -- Handle INSERT and UPDATE
  if TG_OP = 'INSERT' or TG_OP = 'UPDATE' then
    -- Only process expense transactions
    if new.type = 'expense' then
      -- Find or create budget for this category
      select * into budget_record 
      from public.budgets 
      where user_id = new.user_id and category = new.category;
      
      if not found then
        -- Create budget with 0 limit if it doesn't exist
        insert into public.budgets (user_id, category, monthly_limit, current_spent)
        values (new.user_id, new.category, 0.00, new.amount);
      else
        -- Update existing budget
        if TG_OP = 'INSERT' then
          update public.budgets 
          set current_spent = current_spent + new.amount
          where user_id = new.user_id and category = new.category;
        elsif TG_OP = 'UPDATE' then
          -- Adjust by the difference
          update public.budgets 
          set current_spent = current_spent - old.amount + new.amount
          where user_id = new.user_id and category = new.category;
        end if;
      end if;
    end if;
  end if;
  
  -- Handle DELETE
  if TG_OP = 'DELETE' then
    if old.type = 'expense' then
      update public.budgets 
      set current_spent = greatest(0, current_spent - old.amount)
      where user_id = old.user_id and category = old.category;
    end if;
    return old;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to update budget spent
create trigger update_budget_spent_trigger
  after insert or update or delete on public.transactions
  for each row execute procedure public.update_budget_spent();

-- Function to generate insights based on spending patterns
create or replace function public.generate_spending_insights()
returns trigger as $$
declare
  budget_record record;
  spent_percentage numeric;
begin
  -- Only process expense transactions
  if new.type = 'expense' then
    -- Get budget for this category
    select * into budget_record 
    from public.budgets 
    where user_id = new.user_id and category = new.category;
    
    if found and budget_record.monthly_limit > 0 then
      spent_percentage := (budget_record.current_spent / budget_record.monthly_limit) * 100;
      
      -- Generate warning if budget exceeded
      if spent_percentage > 100 then
        insert into public.insights (user_id, type, title, message, category, is_read)
        values (
          new.user_id,
          'warning',
          'Budget Exceeded',
          format('You''ve exceeded your %s budget by DH%.2f this month.', 
                 new.category, 
                 budget_record.current_spent - budget_record.monthly_limit),
          new.category,
          false
        );
      -- Generate alert if 80% of budget used
      elsif spent_percentage > 80 then
        insert into public.insights (user_id, type, title, message, category, is_read)
        values (
          new.user_id,
          'warning',
          'Budget Alert',
          format('You''ve used %.0f%% of your %s budget this month.', 
                 spent_percentage, 
                 new.category),
          new.category,
          false
        );
      end if;
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to generate insights
create trigger generate_spending_insights_trigger
  after insert on public.transactions
  for each row execute procedure public.generate_spending_insights();

-- Insert default categories for new users
create or replace function public.create_default_categories(user_uuid uuid)
returns void as $$
begin
  -- Default expense categories
  insert into public.categories (user_id, name, type, color, icon) values
  (user_uuid, 'Food & Dining', 'expense', '#F97316', 'Utensils'),
  (user_uuid, 'Transportation', 'expense', '#3B82F6', 'Car'),
  (user_uuid, 'Entertainment', 'expense', '#A855F7', 'Gamepad2'),
  (user_uuid, 'Shopping', 'expense', '#F43F5E', 'ShoppingBag'),
  (user_uuid, 'Bills & Utilities', 'expense', '#10B981', 'Home'),
  (user_uuid, 'Income', 'income', '#0EA5E9', 'Wallet');
  
  -- Default budgets for expense categories
  insert into public.budgets (user_id, category, monthly_limit, current_spent) values
  (user_uuid, 'Food & Dining', 600.00, 0.00),
  (user_uuid, 'Transportation', 400.00, 0.00),
  (user_uuid, 'Entertainment', 300.00, 0.00),
  (user_uuid, 'Shopping', 500.00, 0.00),
  (user_uuid, 'Bills & Utilities', 800.00, 0.00);
end;
$$ language plpgsql;

-- Update the user creation function to include default categories
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.user_profiles (id, username)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', new.email, 'user_' || substr(new.id::text, 1, 8))
  );
  
  -- Create default categories and budgets
  perform public.create_default_categories(new.id);
  
  return new;
end;
$$ language plpgsql security definer;