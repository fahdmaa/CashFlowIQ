import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { type User, type InsertUser, type Transaction, type InsertTransaction, type Budget, type InsertBudget, type Insight, type InsertInsight, type Category, type InsertCategory } from "@shared/schema";
import { IStorage } from "./storage";

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          username: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          username: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: string;
          color: string;
          icon: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: string;
          color: string;
          icon: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: string;
          color?: string;
          icon?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          category: string;
          monthly_limit: string;
          current_spent: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category: string;
          monthly_limit: string;
          current_spent?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          category?: string;
          monthly_limit?: string;
          current_spent?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          amount: string;
          description: string;
          category: string;
          type: string;
          date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          amount: string;
          description: string;
          category: string;
          type: string;
          date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          amount?: string;
          description?: string;
          category?: string;
          type?: string;
          date?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      insights: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          category: string | null;
          is_read: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message: string;
          category?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          type?: string;
          title?: string;
          message?: string;
          category?: string | null;
          is_read?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}

export class SupabaseStorage implements IStorage {
  private supabase: SupabaseClient<Database>;

  constructor(supabaseUrl: string, supabaseServiceKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }

  // Users - Note: In Supabase, users are handled by auth.users, but we use user_profiles for additional data
  async createUser(insertUser: InsertUser): Promise<User> {
    // For migration purposes, we'll simulate user creation
    // In real Supabase setup, users are created via Supabase Auth
    const mockUser: User = {
      id: crypto.randomUUID(),
      username: insertUser.username,
      password: insertUser.password, // Note: In Supabase, passwords are handled by auth
      createdAt: new Date()
    };
    
    return mockUser;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !data) {
      return undefined;
    }

    // Return a mock user structure for compatibility with existing auth
    return {
      id: data.id,
      username: data.username,
      password: 'managed_by_supabase', // Placeholder
      createdAt: new Date(data.created_at)
    };
  }

  async getUserById(id: string): Promise<User | undefined> {
    const { data, error } = await this.supabase
      .from('user_profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return undefined;
    }

    return {
      id: data.id,
      username: data.username,
      password: 'managed_by_supabase',
      createdAt: new Date(data.created_at)
    };
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transactions: ${error.message}`);
    }

    return data.map(this.mapTransactionFromDb);
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDate.toISOString())
      .lte('date', endDate.toISOString())
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transactions by date range: ${error.message}`);
    }

    return data.map(this.mapTransactionFromDb);
  }

  async createTransaction(userId: string, insertTransaction: InsertTransaction): Promise<Transaction> {
    const { data, error } = await this.supabase
      .from('transactions')
      .insert({
        user_id: userId,
        amount: insertTransaction.amount,
        description: insertTransaction.description,
        category: insertTransaction.category,
        type: insertTransaction.type,
        date: insertTransaction.date.toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create transaction: ${error.message}`);
    }

    return this.mapTransactionFromDb(data);
  }

  async getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]> {
    const { data, error } = await this.supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .order('date', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch transactions by category: ${error.message}`);
    }

    return data.map(this.mapTransactionFromDb);
  }

  // Budgets
  async getBudgets(userId: string): Promise<Budget[]> {
    const { data, error } = await this.supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch budgets: ${error.message}`);
    }

    return data.map(this.mapBudgetFromDb);
  }

  async getBudgetByCategory(userId: string, category: string): Promise<Budget | undefined> {
    const { data, error } = await this.supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId)
      .eq('category', category)
      .single();

    if (error || !data) {
      return undefined;
    }

    return this.mapBudgetFromDb(data);
  }

  async createBudget(userId: string, insertBudget: InsertBudget): Promise<Budget> {
    const { data, error } = await this.supabase
      .from('budgets')
      .insert({
        user_id: userId,
        category: insertBudget.category,
        monthly_limit: insertBudget.monthlyLimit,
        current_spent: '0.00'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create budget: ${error.message}`);
    }

    return this.mapBudgetFromDb(data);
  }

  async updateBudgetSpent(userId: string, category: string, amount: number): Promise<Budget | undefined> {
    // Note: This is handled by database triggers in Supabase, but we'll implement it for compatibility
    const budget = await this.getBudgetByCategory(userId, category);
    if (!budget) {
      return undefined;
    }

    const newSpent = parseFloat(budget.currentSpent) + amount;
    const { data, error } = await this.supabase
      .from('budgets')
      .update({ current_spent: newSpent.toFixed(2) })
      .eq('user_id', userId)
      .eq('category', category)
      .select()
      .single();

    if (error || !data) {
      return undefined;
    }

    return this.mapBudgetFromDb(data);
  }

  async updateBudgetLimit(userId: string, category: string, monthlyLimit: string): Promise<Budget | undefined> {
    // First, try to update existing budget
    const { data: updateData, error: updateError } = await this.supabase
      .from('budgets')
      .update({ monthly_limit: monthlyLimit })
      .eq('user_id', userId)
      .eq('category', category)
      .select()
      .single();

    if (updateData) {
      return this.mapBudgetFromDb(updateData);
    }

    // If no existing budget, create one
    if (updateError?.code === 'PGRST116') { // No rows returned
      const { data: createData, error: createError } = await this.supabase
        .from('budgets')
        .insert({
          user_id: userId,
          category: category,
          monthly_limit: monthlyLimit,
          current_spent: '0.00'
        })
        .select()
        .single();

      if (createError) {
        return undefined;
      }

      return this.mapBudgetFromDb(createData);
    }

    return undefined;
  }

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch categories: ${error.message}`);
    }

    return data.map(this.mapCategoryFromDb);
  }

  async createCategory(userId: string, insertCategory: InsertCategory): Promise<Category> {
    const { data, error } = await this.supabase
      .from('categories')
      .insert({
        user_id: userId,
        name: insertCategory.name,
        type: insertCategory.type,
        color: insertCategory.color,
        icon: insertCategory.icon
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create category: ${error.message}`);
    }

    return this.mapCategoryFromDb(data);
  }

  // Insights
  async getInsights(userId: string): Promise<Insight[]> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch insights: ${error.message}`);
    }

    return data.map(this.mapInsightFromDb);
  }

  async createInsight(userId: string, insertInsight: InsertInsight): Promise<Insight> {
    const { data, error } = await this.supabase
      .from('insights')
      .insert({
        user_id: userId,
        type: insertInsight.type,
        title: insertInsight.title,
        message: insertInsight.message,
        category: insertInsight.category || null,
        is_read: insertInsight.isRead === 'true'
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create insight: ${error.message}`);
    }

    return this.mapInsightFromDb(data);
  }

  async markInsightAsRead(userId: string, id: string): Promise<void> {
    const { error } = await this.supabase
      .from('insights')
      .update({ is_read: true })
      .eq('user_id', userId)
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to mark insight as read: ${error.message}`);
    }
  }

  // Private helper methods to map database records to application models
  private mapTransactionFromDb(data: Database['public']['Tables']['transactions']['Row']): Transaction {
    return {
      id: data.id,
      userId: data.user_id,
      amount: data.amount,
      description: data.description,
      category: data.category,
      type: data.type as 'income' | 'expense',
      date: new Date(data.date),
      createdAt: new Date(data.created_at)
    };
  }

  private mapBudgetFromDb(data: Database['public']['Tables']['budgets']['Row']): Budget {
    return {
      id: data.id,
      userId: data.user_id,
      category: data.category,
      monthlyLimit: data.monthly_limit,
      currentSpent: data.current_spent,
      createdAt: new Date(data.created_at)
    };
  }

  private mapCategoryFromDb(data: Database['public']['Tables']['categories']['Row']): Category {
    return {
      id: data.id,
      userId: data.user_id,
      name: data.name,
      type: data.type as 'income' | 'expense',
      color: data.color,
      icon: data.icon,
      createdAt: new Date(data.created_at)
    };
  }

  private mapInsightFromDb(data: Database['public']['Tables']['insights']['Row']): Insight {
    return {
      id: data.id,
      userId: data.user_id,
      type: data.type as 'warning' | 'success' | 'info',
      title: data.title,
      message: data.message,
      category: data.category,
      isRead: data.is_read ? 'true' : 'false',
      createdAt: new Date(data.created_at)
    };
  }
}