import { supabase } from './supabase-auth';
import { getAuthToken } from './supabase-auth';

// Set auth token for all requests
const setAuthToken = async () => {
  const token = getAuthToken();
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (token && refreshToken) {
    try {
      await supabase.auth.setSession({
        access_token: token,
        refresh_token: refreshToken
      });
    } catch (error) {
      console.error('Error setting auth session:', error);
    }
  }
};

// Transactions
export const getTransactions = async () => {
  await setAuthToken();
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data || [];
};

export const createTransaction = async (transaction: any) => {
  await setAuthToken();
  
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

export const updateTransaction = async (transactionId: string, transaction: any) => {
  console.log(`updateTransaction called with ID: ${transactionId}`, transaction);
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User authentication failed:', userError);
    throw new Error('User not authenticated');
  }
  
  console.log(`User authenticated: ${user.id}, updating transaction: ${transactionId}`);
  
  // Update the transaction
  const { data, error } = await supabase
    .from('transactions')
    .update({
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: new Date(transaction.date).toISOString(),
    })
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .select()
    .single();
  
  console.log('Update transaction result:', { data, error });
  
  if (error) {
    console.error('Update error:', error);
    throw new Error(error.message);
  }
  
  if (!data) {
    console.warn('No transaction was updated - may not exist or belong to user');
    throw new Error('Transaction not found or you do not have permission to edit it');
  }
  
  console.log('Transaction updated successfully:', data);
  return data;
};

// Categories
export const getCategories = async () => {
  await setAuthToken();
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  if (error) throw new Error(error.message);
  return data || [];
};

export const createCategory = async (category: any) => {
  console.log('createCategory called with:', category);
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User authentication failed:', userError);
    throw new Error('User not authenticated');
  }
  
  console.log(`User authenticated: ${user.id}, creating category: ${category.name}`);
  
  const insertData = {
    user_id: user.id,
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon
  };
  
  console.log('Inserting category data:', insertData);
  
  const { data, error } = await supabase
    .from('categories')
    .insert([insertData])
    .select()
    .single();
  
  console.log('Category creation result:', { data, error });
  
  if (error) {
    console.error('Category creation error:', error);
    throw new Error(error.message);
  }
  
  console.log('Category created successfully:', data);
  return data;
};

export const deleteCategory = async (categoryId: string) => {
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');
  
  // Delete the category (this will cascade delete related budgets due to database constraints)
  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', categoryId)
    .eq('user_id', user.id); // Extra security check
  
  if (error) throw new Error(error.message);
  
  return { success: true };
};

export const deleteBudget = async (budgetId: string) => {
  console.log(`deleteBudget called with budgetId: ${budgetId}`);
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User authentication failed:', userError);
    throw new Error('User not authenticated');
  }
  
  console.log(`User authenticated: ${user.id}, attempting to delete budget: ${budgetId}`);
  
  // Delete the budget
  const { data, error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', user.id)
    .select(); // Add select to see what was deleted
  
  console.log('Delete operation result:', { data, error });
  
  if (error) {
    console.error('Delete error:', error);
    throw new Error(error.message);
  }
  
  if (!data || data.length === 0) {
    console.warn('No rows were deleted - budget may not exist or belong to user');
    throw new Error('Budget not found or you do not have permission to delete it');
  }
  
  console.log('Budget deleted successfully:', data);
  return { success: true, deleted: data[0] };
};

// Budgets
export const getBudgets = async () => {
  await setAuthToken();
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .order('category');
  
  if (error) throw new Error(error.message);
  
  console.log('Raw budget data from database:', data);
  
  // Transform snake_case to camelCase to match frontend expectations
  const transformedData = (data || []).map(budget => ({
    id: budget.id,
    category: budget.category,
    monthlyLimit: budget.monthly_limit,
    currentSpent: budget.current_spent,
    user_id: budget.user_id,
    created_at: budget.created_at,
    updated_at: budget.updated_at
  }));
  
  console.log('Transformed budget data:', transformedData);
  return transformedData;
};

export const createBudget = async (budget: any) => {
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('budgets')
    .insert([{
      user_id: user.id,
      category: budget.category,
      monthly_limit: parseFloat(budget.monthlyLimit),
      current_spent: 0
    }])
    .select()
    .single();
  
  if (error) throw new Error(error.message);
  
  // Transform response to match frontend expectations
  return {
    id: data.id,
    category: data.category,
    monthlyLimit: data.monthly_limit,
    currentSpent: data.current_spent,
    user_id: data.user_id,
    created_at: data.created_at,
    updated_at: data.updated_at
  };
};

export const updateBudget = async (category: string, monthlyLimit: number) => {
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');
  
  // First, try to update existing budget
  const { data: updateData, error: updateError } = await supabase
    .from('budgets')
    .update({ monthly_limit: monthlyLimit })
    .eq('user_id', user.id)
    .eq('category', category)
    .select();
  
  // If update succeeded and found a row, return it
  if (!updateError && updateData && updateData.length > 0) {
    const data = updateData[0];
    return {
      id: data.id,
      category: data.category,
      monthlyLimit: data.monthly_limit,
      currentSpent: data.current_spent,
      user_id: data.user_id,
      created_at: data.created_at,
      updated_at: data.updated_at
    };
  }
  
  // If budget doesn't exist, create it
  console.log(`Budget for ${category} doesn't exist, creating new one`);
  const { data: insertData, error: insertError } = await supabase
    .from('budgets')
    .insert({
      user_id: user.id,
      category: category,
      monthly_limit: monthlyLimit,
      current_spent: 0
    })
    .select()
    .single();
  
  if (insertError) {
    console.error('Supabase insert error:', insertError);
    throw new Error(insertError.message);
  }
  
  // Transform response to match frontend expectations
  return {
    id: insertData.id,
    category: insertData.category,
    monthlyLimit: insertData.monthly_limit,
    currentSpent: insertData.current_spent,
    user_id: insertData.user_id,
    created_at: insertData.created_at,
    updated_at: insertData.updated_at
  };
};

// Clean up duplicate budgets (one-time function)
export const cleanupDuplicateBudgets = async () => {
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');
  
  // Delete any budgets with URL-encoded category names
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('user_id', user.id)
    .like('category', '%20%'); // Delete categories with encoded spaces (%20)
  
  if (error) {
    console.error('Error cleaning up duplicate budgets:', error);
  } else {
    console.log('Successfully cleaned up duplicate budgets');
  }
};

// Analytics
export const getOverviewAnalytics = async () => {
  await setAuthToken();
  
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