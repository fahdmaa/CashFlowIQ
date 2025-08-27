import { createClient } from '@supabase/supabase-js';
import { getAuthToken } from './supabase-auth';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Set auth token for all requests
const setAuthToken = () => {
  const token = getAuthToken();
  if (token) {
    supabase.auth.setSession({
      access_token: token,
      refresh_token: localStorage.getItem('refreshToken') || '',
      expires_in: 3600,
      token_type: 'bearer',
      user: null as any
    });
  }
};

// Transactions
export const getTransactions = async () => {
  setAuthToken();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data || [];
};

export const createTransaction = async (transaction: any) => {
  setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: new Date(transaction.date).toISOString(),
      user_id: user.id
    }])
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

// Categories
export const getCategories = async () => {
  setAuthToken();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw new Error(error.message);
  return data || [];
};

// Analytics
export const getOverviewAnalytics = async () => {
  setAuthToken();
  
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, type')
    .gte('date', startOfMonth.toISOString())
    .lte('date', endOfMonth.toISOString());

  if (error) throw new Error(error.message);

  const monthlyIncome = (transactions || [])
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
  const monthlySpending = (transactions || [])
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  const currentBalance = monthlyIncome - monthlySpending;
  
  // Calculate savings goal progress (assuming goal is to save 20% of income)
  const savingsGoal = monthlyIncome * 0.2;
  const actualSavings = monthlyIncome - monthlySpending;
  const savingsProgress = savingsGoal > 0 ? Math.min((actualSavings / savingsGoal) * 100, 100) : 0;

  return {
    currentBalance,
    monthlyIncome,
    monthlySpending,
    savingsProgress: Math.round(savingsProgress)
  };
};