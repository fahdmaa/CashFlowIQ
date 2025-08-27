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

export const deleteTransaction = async (transactionId: string) => {
  console.log(`deleteTransaction called with ID: ${transactionId}`);
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User authentication failed:', userError);
    throw new Error('User not authenticated');
  }
  
  console.log(`User authenticated: ${user.id}, deleting transaction: ${transactionId}`);
  
  // Delete the transaction
  const { data, error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', transactionId)
    .eq('user_id', user.id)
    .select();
  
  console.log('Delete transaction result:', { data, error });
  
  if (error) {
    console.error('Delete error:', error);
    throw new Error(error.message);
  }
  
  if (!data || data.length === 0) {
    console.warn('No transaction was deleted - may not exist or belong to user');
    throw new Error('Transaction not found or you do not have permission to delete it');
  }
  
  console.log('Transaction deleted successfully:', data);
  return { success: true, deleted: data[0] };
};

// Categories
export const getCategories = async () => {
  console.log('getCategories: Fetching categories from database...');
  await setAuthToken();
  
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('name');
  
  console.log('getCategories: Database result:', { data, error });
  
  if (error) {
    console.error('getCategories: Error fetching categories:', error);
    throw new Error(error.message);
  }
  
  console.log('getCategories: Returning categories:', data?.length || 0, 'items');
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
  
  const { data: categoryData, error } = await supabase
    .from('categories')
    .insert([insertData])
    .select()
    .single();
  
  console.log('Category creation result:', { data: categoryData, error });
  
  if (error) {
    console.error('Category creation error:', error);
    throw new Error(error.message);
  }
  
  console.log('Category created successfully:', categoryData);
  
  // Only create budget for expense categories (income categories don't need budgets)
  if (category.type === 'expense') {
    console.log('Creating default budget for expense category:', category.name);
    
    try {
      const budgetData = {
        user_id: user.id,
        category: category.name,
        monthly_limit: 500, // Default budget limit
        current_spent: 0
      };
      
      const { data: budgetResult, error: budgetError } = await supabase
        .from('budgets')
        .insert([budgetData])
        .select()
        .single();
      
      if (budgetError) {
        console.warn('Budget creation failed (continuing anyway):', budgetError);
      } else {
        console.log('Default budget created successfully:', budgetResult);
      }
    } catch (budgetErr) {
      console.warn('Budget creation error (continuing anyway):', budgetErr);
    }
  }
  
  return categoryData;
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

// Update category name
export const updateCategory = async (categoryId: string, newName: string) => {
  console.log(`updateCategory called with categoryId: ${categoryId}, newName: ${newName}`);
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User authentication failed:', userError);
    throw new Error('User not authenticated');
  }
  
  console.log(`User authenticated: ${user.id}, updating category: ${categoryId} to ${newName}`);
  
  // First, get the current category to know the old name
  const { data: currentCategory, error: fetchError } = await supabase
    .from('categories')
    .select('name')
    .eq('id', categoryId)
    .eq('user_id', user.id)
    .single();
  
  if (fetchError || !currentCategory) {
    console.error('Error fetching current category:', fetchError);
    throw new Error('Category not found or you do not have permission to edit it');
  }
  
  const oldName = currentCategory.name;
  console.log(`Current category name: ${oldName}, changing to: ${newName}`);
  
  // Update the category name
  const { data: updatedCategory, error: updateError } = await supabase
    .from('categories')
    .update({ name: newName })
    .eq('id', categoryId)
    .eq('user_id', user.id)
    .select()
    .single();
  
  if (updateError) {
    console.error('Category update error:', updateError);
    throw new Error(updateError.message);
  }
  
  console.log('Category updated successfully:', updatedCategory);
  
  // Update all budgets that reference this category
  const { error: budgetUpdateError } = await supabase
    .from('budgets')
    .update({ category: newName })
    .eq('category', oldName)
    .eq('user_id', user.id);
  
  if (budgetUpdateError) {
    console.warn('Budget update error (continuing anyway):', budgetUpdateError);
    // Don't throw here - category was updated successfully
  } else {
    console.log('Associated budgets updated successfully');
  }
  
  // Update all transactions that reference this category
  const { error: transactionUpdateError } = await supabase
    .from('transactions')
    .update({ category: newName })
    .eq('category', oldName)
    .eq('user_id', user.id);
  
  if (transactionUpdateError) {
    console.warn('Transaction update error (continuing anyway):', transactionUpdateError);
    // Don't throw here - category was updated successfully
  } else {
    console.log('Associated transactions updated successfully');
  }
  
  return { 
    success: true, 
    updated: updatedCategory,
    oldName,
    newName 
  };
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
  
  // First, get the budget to find the associated category
  const { data: budgetData, error: budgetFetchError } = await supabase
    .from('budgets')
    .select('category')
    .eq('id', budgetId)
    .eq('user_id', user.id)
    .single();
  
  if (budgetFetchError || !budgetData) {
    console.error('Failed to fetch budget:', budgetFetchError);
    throw new Error('Budget not found or you do not have permission to delete it');
  }
  
  const categoryName = budgetData.category;
  console.log(`Found budget with category: ${categoryName}`);
  
  // Delete the budget
  const { data: deletedBudget, error: budgetDeleteError } = await supabase
    .from('budgets')
    .delete()
    .eq('id', budgetId)
    .eq('user_id', user.id)
    .select();
  
  if (budgetDeleteError) {
    console.error('Budget delete error:', budgetDeleteError);
    throw new Error(budgetDeleteError.message);
  }
  
  console.log('Budget deleted successfully:', deletedBudget);
  
  // Now delete the associated category
  console.log(`Attempting to delete associated category: ${categoryName}`);
  const { data: deletedCategory, error: categoryDeleteError } = await supabase
    .from('categories')
    .delete()
    .eq('name', categoryName)
    .eq('user_id', user.id)
    .select();
  
  if (categoryDeleteError) {
    console.warn('Category delete error (continuing anyway):', categoryDeleteError);
    // Don't throw here - budget was deleted successfully, category deletion is secondary
  } else {
    console.log('Associated category deleted successfully:', deletedCategory);
  }
  
  return { 
    success: true, 
    deletedBudget: deletedBudget?.[0], 
    deletedCategory: deletedCategory?.[0] 
  };
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

// Clean up orphaned categories (categories without corresponding budgets)
export const cleanupOrphanedCategories = async () => {
  console.log('Starting cleanup of orphaned categories');
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User authentication failed:', userError);
    throw new Error('User not authenticated');
  }
  
  console.log(`User authenticated: ${user.id}, finding orphaned categories`);
  
  // Get all categories for this user
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id);
  
  if (categoriesError) {
    console.error('Error fetching categories:', categoriesError);
    throw new Error(categoriesError.message);
  }
  
  // Get all budgets for this user  
  const { data: budgets, error: budgetsError } = await supabase
    .from('budgets')
    .select('category')
    .eq('user_id', user.id);
  
  if (budgetsError) {
    console.error('Error fetching budgets:', budgetsError);
    throw new Error(budgetsError.message);
  }
  
  const budgetCategoryNames = new Set(budgets?.map(b => b.category) || []);
  const orphanedCategories = categories?.filter(c => !budgetCategoryNames.has(c.name)) || [];
  
  console.log('Found categories:', categories?.length || 0);
  console.log('Found budgets:', budgets?.length || 0);
  console.log('Orphaned categories:', orphanedCategories);
  
  if (orphanedCategories.length === 0) {
    console.log('No orphaned categories found');
    return { cleanedUp: 0, categories: [] };
  }
  
  // Delete orphaned categories
  const orphanedIds = orphanedCategories.map(c => c.id);
  const { data: deletedCategories, error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('user_id', user.id)
    .in('id', orphanedIds)
    .select();
  
  if (deleteError) {
    console.error('Error deleting orphaned categories:', deleteError);
    throw new Error(deleteError.message);
  }
  
  console.log('Successfully cleaned up orphaned categories:', deletedCategories);
  return { 
    cleanedUp: deletedCategories?.length || 0, 
    categories: deletedCategories || [] 
  };
};

// Analytics
export const getOverviewAnalytics = async () => {
  await setAuthToken();
  
  const currentMonth = new Date();
  const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, type, category')
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
  
  // Calculate savings based on "savings" category sum
  const savingsAmount = (transactions || [])
    .filter(t => t.category && t.category.toLowerCase() === "savings")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  
  // Use savings amount directly as percentage (or show actual amount)
  // For now, let's show actual savings amount as the "progress"
  const savingsProgress = savingsAmount;

  return {
    currentBalance,
    monthlyIncome,
    monthlySpending,
    savingsProgress: Math.round(savingsProgress * 100) / 100 // Round to 2 decimal places
  };
};