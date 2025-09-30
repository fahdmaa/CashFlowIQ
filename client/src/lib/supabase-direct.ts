import { supabase } from './supabase-auth';
import { getAuthToken } from './supabase-auth';
import { normalizeAmount, normalizeDateToISO } from './normalize';

// Helper function to calculate salary cycle dates (27th to 26th)
const getSalaryCycleDates = (selectedMonth?: string) => {
  let targetDate: Date;
  
  if (selectedMonth) {
    // Parse selectedMonth in format "YYYY-MM"
    const [year, month] = selectedMonth.split('-').map(Number);
    targetDate = new Date(year, month - 1, 1);
  } else {
    // For current date, determine which salary cycle we're in
    const today = new Date();
    const currentDay = today.getDate();
    
    if (currentDay >= 27) {
      // We're in the next month's salary cycle (starts on 27th)
      targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    } else {
      // We're still in the current month's salary cycle
      targetDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
  }
  
  // Salary cycle: 27th of previous month to 26th of current month
  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();
  
  // Start date: 27th of previous month
  const startDate = new Date(year, month - 1, 27);
  // End date: 26th of current month
  const endDate = new Date(year, month, 26, 23, 59, 59, 999);
  
  return { startDate, endDate };
};

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
export const getTransactions = async (selectedMonth?: string) => {
  await setAuthToken();

  let query = supabase
    .from('transactions')
    .select('*')
    .order('date', { ascending: false });

  // Filter by fiscal month or salary cycle if month provided
  if (selectedMonth) {
    // Try to use fiscal months first, fallback to salary cycle
    const fiscalDates = await getFiscalCycleDates(selectedMonth);

    console.log(`Filtering transactions for fiscal cycle from ${fiscalDates.startDate.toISOString()} to ${fiscalDates.endDate.toISOString()}`);
    query = query
      .gte('date', fiscalDates.startDate.toISOString())
      .lte('date', fiscalDates.endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  console.log(`Retrieved ${data?.length || 0} transactions for month: ${selectedMonth || 'all'}`);
  return data || [];
};

export const createTransaction = async (transaction: any) => {
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');
  
  const amountStr = normalizeAmount(transaction.amount);
  if (!amountStr) {
    throw new Error('Amount must be a valid number (e.g., 28 or 28.00).');
  }

  const { data, error } = await supabase
    .from('transactions')
    .insert([{
      amount: parseFloat(amountStr),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: normalizeDateToISO(transaction.date),
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
  
  const amountStr2 = normalizeAmount(transaction.amount);
  if (!amountStr2) {
    throw new Error('Amount must be a valid number (e.g., 28 or 28.00).');
  }

  const { data, error } = await supabase
    .from('transactions')
    .update({
      amount: parseFloat(amountStr2),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: normalizeDateToISO(transaction.date),
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
export const getBudgets = async (selectedMonth?: string) => {
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .order('category');
  
  if (error) throw new Error(error.message);
  
  console.log('Raw budget data from database:', data);
  
  // Calculate actual spending for the selected fiscal/salary cycle (or current cycle if none selected)
  const fiscalDates = await getFiscalCycleDates(selectedMonth);
  const { startDate, endDate } = fiscalDates;

  console.log(`Calculating spending for fiscal cycle from ${startDate.toISOString()} to ${endDate.toISOString()}`);

  // Get transactions for the selected fiscal/salary cycle
  const { data: transactions, error: txError } = await supabase
    .from('transactions')
    .select('amount, category, type')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString());
  
  if (txError) {
    console.warn('Error fetching transactions for budget calculation:', txError);
  }
  
  // Calculate spending by category for the selected month
  const spendingByCategory: Record<string, number> = {};
  (transactions || []).forEach(tx => {
    const category = tx.category;
    const amount = parseFloat(tx.amount.toString());
    spendingByCategory[category] = (spendingByCategory[category] || 0) + amount;
  });
  
  console.log('Spending by category for selected month:', spendingByCategory);
  
  // Transform budget data with calculated spending
  const transformedData = (data || []).map(budget => ({
    id: budget.id,
    category: budget.category,
    monthlyLimit: budget.monthly_limit,
    currentSpent: spendingByCategory[budget.category] || 0, // Use calculated spending for selected month
    user_id: budget.user_id,
    created_at: budget.created_at,
    updated_at: budget.updated_at
  }));
  
  console.log('Transformed budget data with monthly spending:', transformedData);
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
export const getOverviewAnalytics = async (selectedMonth?: string) => {
  await setAuthToken();

  // Use fiscal months if available, otherwise fallback to salary cycle
  const fiscalDates = await getFiscalCycleDates(selectedMonth);
  const { startDate, endDate } = fiscalDates;
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, type, category')
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString());

  if (error) throw new Error(error.message);

  const monthlyIncome = (transactions || [])
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
    
  const monthlySpending = (transactions || [])
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
  
  // Calculate savings - transactions with type "savings"
  const savingsAmount = (transactions || [])
    .filter(t => t.type === "savings")
    .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

  // Current balance = income - spending - savings (savings are deducted from income)
  const currentBalance = monthlyIncome - monthlySpending - savingsAmount;
  
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

// Get spending analytics for chart (daily spending over specified period)
export const getSpendingAnalytics = async (days: number = 7, selectedMonth?: string) => {
  console.log(`getSpendingAnalytics called for ${days} days, month: ${selectedMonth}`);
  await setAuthToken();
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.error('User authentication failed:', userError);
    throw new Error('User not authenticated');
  }
  
  let endDate: Date;
  let startDate: Date;
  
  if (selectedMonth) {
    // Use fiscal/salary cycle dates for the selected month
    const fiscalDates = await getFiscalCycleDates(selectedMonth);
    const { startDate: cycleStart, endDate: cycleEnd } = fiscalDates;
    
    // For spending analytics, we still want to respect the 'days' parameter within the cycle
    const cycleDays = Math.ceil((cycleEnd.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));
    if (days >= cycleDays) {
      // Show the entire salary cycle
      startDate = cycleStart;
      endDate = cycleEnd;
    } else {
      // Show last 'days' within the salary cycle, up to the cycle end date
      endDate = cycleEnd;
      startDate = new Date(cycleEnd);
      startDate.setDate(cycleEnd.getDate() - days + 1);
      // Make sure startDate doesn't go before cycleStart
      if (startDate < cycleStart) {
        startDate = cycleStart;
      }
    }
  } else {
    // Default behavior - last N days from today
    endDate = new Date();
    startDate = new Date();
    startDate.setDate(endDate.getDate() - days + 1);
  }
  
  console.log(`Fetching spending data from ${startDate.toISOString()} to ${endDate.toISOString()}`);
  
  const { data: transactions, error } = await supabase
    .from('transactions')
    .select('amount, date, type')
    .eq('user_id', user.id)
    .eq('type', 'expense')
    .gte('date', startDate.toISOString())
    .lte('date', endDate.toISOString())
    .order('date', { ascending: true });
    
  if (error) {
    console.error('Error fetching spending analytics:', error);
    throw new Error(error.message);
  }
  
  console.log(`Found ${transactions?.length || 0} expense transactions`);
  
  // Group transactions by date and sum spending per day
  const spendingByDate: Record<string, number> = {};
  
  // Initialize all dates in the range with 0 (oldest -> newest), anchored to endDate
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - i);
    const dateKey = date.toISOString().split('T')[0]; // YYYY-MM-DD format
    spendingByDate[dateKey] = 0;
  }
  
  // Sum up actual spending by date
  (transactions || []).forEach(transaction => {
    const dateKey = transaction.date.split('T')[0]; // Extract date part
    const amount = parseFloat(transaction.amount.toString());
    if (spendingByDate.hasOwnProperty(dateKey)) {
      spendingByDate[dateKey] += amount;
    }
  });
  
  console.log('Spending by date (oldest to newest):', spendingByDate);
  
  return spendingByDate;
};

// User Profile Functions
export const getUserProfile = async () => {
  await setAuthToken();
  
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');
  
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  
  if (error) throw new Error(error.message);
  return data;
};

export const updateUserProfile = async (updates: { username?: string; profile_picture_url?: string | null }) => {
  console.log('========== USER PROFILE UPDATE DEBUG START ==========');
  console.log('updateUserProfile called with updates:', updates);
  
  console.log('Step 1: Setting auth token for profile update...');
  await setAuthToken();
  
  console.log('Step 2: Getting user for profile update...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  console.log('User auth result for profile update:', {
    hasUser: !!user,
    userId: user?.id || 'No ID',
    userError: userError?.message || 'No error'
  });
  
  if (userError || !user) {
    console.error('❌ User authentication failed in updateUserProfile:', userError);
    throw new Error('User not authenticated');
  }
  
  console.log('Step 3: Authenticated user for profile update:', user.id);
  console.log('Step 4: Attempting database update with:', {
    table: 'user_profiles',
    updates: updates,
    whereClause: `id = ${user.id}`,
    selectAll: true,
    returnSingle: true
  });
  
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', user.id)
    .select()
    .single();
  
  console.log('Step 5: Database update result:', {
    success: !error,
    data: data,
    error: error
  });
  
  if (error) {
    console.error('❌ DATABASE UPDATE ERROR IN updateUserProfile ❌');
    console.error('Full error object:', error);
    console.error('Error breakdown:', {
      message: error.message,
      code: error.code,
      details: error.details || 'No details',
      hint: error.hint || 'No hint'
    });
    
    // Check if it's a RLS error specifically
    if (error.message?.includes('row level security') || 
        error.message?.includes('policy') || 
        error.message?.includes('RLS')) {
      console.error('❌ THIS IS A USER_PROFILES TABLE RLS POLICY ERROR ❌');
      console.error('The user_profiles table RLS policy is blocking the update');
      console.error('User ID being used:', user.id);
      console.error('Updates being applied:', updates);
    }
    
    // Check if it's a table/column issue
    if (error.message?.includes('column') || error.message?.includes('table')) {
      console.error('❌ THIS IS A TABLE/COLUMN STRUCTURE ERROR ❌');
      console.error('The user_profiles table may be missing the profile_picture_url column');
    }
    
    throw new Error(`Profile update failed: ${error.message}`);
  }
  
  console.log('✅ Profile updated successfully in database:', data);
  console.log('========== USER PROFILE UPDATE DEBUG SUCCESS ==========');
  return data;
};

export const uploadProfilePicture = async (file: File) => {
  try {
    console.log('========== PROFILE PICTURE UPLOAD DEBUG START ==========');
    console.log('Starting profile picture upload process...');
    console.log('File details:', {
      name: file.name,
      size: file.size,
      type: file.type,
      lastModified: file.lastModified
    });
    
    // Ensure we have a valid session
    console.log('Step 1: Setting auth token...');
    await setAuthToken();
    
    // Wait a moment for auth session to be properly set
    console.log('Step 2: Waiting for auth session to stabilize...');
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Get current session info for debugging
    console.log('Step 3: Checking current session...');
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session details:', {
      hasSession: !!session,
      sessionError: sessionError,
      accessToken: session?.access_token ? 'Present' : 'Missing',
      refreshToken: session?.refresh_token ? 'Present' : 'Missing',
      userId: session?.user?.id || 'No user ID',
      userEmail: session?.user?.email || 'No email'
    });
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      throw new Error(`Session error: ${sessionError.message}`);
    }
    
    if (!session) {
      console.error('No active session found');
      throw new Error('No active session found');
    }
    
    console.log('Step 4: Getting authenticated user...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('User authentication result:', {
      hasUser: !!user,
      userId: user?.id || 'No ID',
      userEmail: user?.email || 'No email',
      userError: userError?.message || 'No error'
    });
    
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      throw new Error('User not authenticated');
    }
    
    console.log('Step 5: User authenticated successfully with ID:', user.id);
    
    // Validate file
    console.log('Step 6: Validating file...');
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image');
    }
    
    if (file.size > 5 * 1024 * 1024) { // 5MB
      throw new Error('File size must be less than 5MB');
    }
    
    // Generate unique filename with timestamp to avoid caching issues
    const fileExt = file.name.split('.').pop();
    const timestamp = Date.now();
    const fileName = `${user.id}/profile-${timestamp}.${fileExt}`;
    
    console.log('Step 7: Generated filename:', fileName);
    console.log('Path structure check:', {
      userId: user.id,
      userIdType: typeof user.id,
      userIdLength: user.id.length,
      fullPath: fileName,
      pathParts: fileName.split('/')
    });
    
    console.log('Step 8: Attempting storage upload...');
    console.log('Storage upload parameters:', {
      bucket: 'avatar-pictures',
      fileName: fileName,
      fileSize: file.size,
      fileType: file.type,
      options: { cacheControl: '3600', upsert: true }
    });
    
    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('avatar-pictures')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true // Replace existing file
      });
    
    console.log('Step 9: Storage upload result:', {
      success: !uploadError,
      uploadData: uploadData,
      uploadError: uploadError
    });
    
    if (uploadError) {
      console.error('❌ STORAGE UPLOAD ERROR OCCURRED HERE ❌');
      console.error('Full error object:', uploadError);
      console.error('Error breakdown:', {
        message: uploadError.message,
        statusCode: uploadError.statusCode,
        error: uploadError.error,
        details: uploadError.details || 'No details',
        hint: uploadError.hint || 'No hint'
      });
      
      // Check if it's a RLS error specifically
      if (uploadError.message?.includes('row level security') || 
          uploadError.message?.includes('policy') || 
          uploadError.message?.includes('RLS')) {
        console.error('❌ THIS IS A STORAGE RLS POLICY ERROR ❌');
        console.error('The error is happening during storage upload, not database update');
      }
      
      throw new Error(`Storage upload failed: ${uploadError.message}`);
    }
    
    console.log('✅ Step 10: Storage upload successful!');
    console.log('Upload data:', uploadData);
    
    // Get public URL
    console.log('Step 11: Getting public URL...');
    const { data: { publicUrl } } = supabase.storage
      .from('avatar-pictures')
      .getPublicUrl(fileName);
    
    console.log('Generated public URL:', publicUrl);
    
    // Update user profile with new picture URL
    console.log('Step 12: Updating user profile in database...');
    console.log('Profile update parameters:', {
      userId: user.id,
      profilePictureUrl: publicUrl
    });
    
    try {
      const profileData = await updateUserProfile({ profile_picture_url: publicUrl });
      console.log('✅ Step 13: Profile update successful!');
      console.log('Profile data result:', profileData);
      
      console.log('========== PROFILE PICTURE UPLOAD DEBUG SUCCESS ==========');
      return { url: publicUrl, path: uploadData.path };
    } catch (profileError) {
      console.error('❌ DATABASE PROFILE UPDATE ERROR OCCURRED HERE ❌');
      console.error('Profile update failed, but upload succeeded:', profileError);
      console.error('Full profile error:', profileError);
      
      // Check if it's a RLS error specifically
      if (profileError.message?.includes('row level security') || 
          profileError.message?.includes('policy') || 
          profileError.message?.includes('RLS')) {
        console.error('❌ THIS IS A DATABASE RLS POLICY ERROR ❌');
        console.error('The error is happening during profile update, not storage upload');
      }
      
      // Delete uploaded file if profile update fails
      console.log('Cleaning up uploaded file due to profile update failure...');
      try {
        await supabase.storage.from('avatar-pictures').remove([fileName]);
        console.log('Cleaned up uploaded file due to profile update failure');
      } catch (cleanupError) {
        console.warn('Failed to clean up uploaded file:', cleanupError);
      }
      throw profileError;
    }
  } catch (error) {
    console.error('========== PROFILE PICTURE UPLOAD DEBUG FAILED ==========');
    console.error('Upload process failed at top level:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    throw error;
  }
};

export const deleteProfilePicture = async () => {
  try {
    await setAuthToken();
    
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('User authentication failed:', userError);
      throw new Error('User not authenticated');
    }
    
    console.log('Deleting profile picture for user:', user.id);
    
    // Get current profile to find existing picture
    const profile = await getUserProfile();
    
    if (profile.profile_picture_url) {
      // Extract filename from URL - handle both old and new filename formats
      const urlParts = profile.profile_picture_url.split('/');
      const fileName = urlParts[urlParts.length - 1];
      const fullFileName = `${user.id}/${fileName}`;
      
      console.log('Deleting file from storage:', fullFileName);
      
      // Delete from storage
      const { error: deleteError } = await supabase.storage
        .from('avatar-pictures')
        .remove([fullFileName]);
      
      if (deleteError) {
        console.warn('Error deleting file from storage:', deleteError);
        // Continue with profile update even if file deletion fails
      }
    }
    
    // Update profile to remove picture URL
    await updateUserProfile({ profile_picture_url: null });
    
    console.log('Profile picture deleted successfully');
    return { success: true };
  } catch (error) {
    console.error('Delete profile picture failed:', error);
    throw error;
  }
};

// Fiscal Month Management Functions
export const getCurrentFiscalMonth = async () => {
  await setAuthToken();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');

  // Get the latest fiscal month record for the user
  const { data, error } = await supabase
    .from('fiscal_months')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error fetching fiscal month:', error);
    // If table doesn't exist or no records, return null
    return null;
  }

  return data?.[0] || null;
};

export const startNewFiscalMonth = async () => {
  await setAuthToken();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');

  const today = new Date();
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  // Close the current fiscal month if exists
  const currentFiscalMonth = await getCurrentFiscalMonth();
  if (currentFiscalMonth && !currentFiscalMonth.end_date) {
    // Update the current month with an end date
    await supabase
      .from('fiscal_months')
      .update({
        end_date: today.toISOString(),
        is_active: false
      })
      .eq('id', currentFiscalMonth.id);
  }

  // Create a new fiscal month starting from today
  const { data, error } = await supabase
    .from('fiscal_months')
    .insert([{
      user_id: user.id,
      month_label: nextMonth.toLocaleDateString('en-US', { year: 'numeric', month: 'long' }),
      start_date: today.toISOString(),
      end_date: null, // Will be set when next month starts
      is_active: true
    }])
    .select()
    .single();

  if (error) {
    console.error('Error creating new fiscal month:', error);
    throw new Error(error.message);
  }

  console.log('New fiscal month started:', data);
  return data;
};

// Helper function to get fiscal month for a given date
export const getFiscalMonthForDate = async (date: Date) => {
  await setAuthToken();

  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) throw new Error('User not authenticated');

  // Get all fiscal months and find which one contains this date
  const { data, error } = await supabase
    .from('fiscal_months')
    .select('*')
    .eq('user_id', user.id)
    .lte('start_date', date.toISOString())
    .order('start_date', { ascending: false });

  if (error || !data || data.length === 0) {
    // No fiscal month found, use calendar month
    return null;
  }

  // Find the right fiscal month
  for (const month of data) {
    if (!month.end_date || new Date(month.end_date) >= date) {
      return month;
    }
  }

  return null;
};

// Modified helper to calculate dates based on fiscal months
export const getFiscalCycleDates = async (selectedMonth?: string) => {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) return getSalaryCycleDates(selectedMonth); // Fallback to salary cycle

  // Get all fiscal months
  const { data: fiscalMonths, error } = await supabase
    .from('fiscal_months')
    .select('*')
    .eq('user_id', user.id)
    .order('start_date', { ascending: false });

  if (error || !fiscalMonths || fiscalMonths.length === 0) {
    // No fiscal months, use salary cycle dates
    return getSalaryCycleDates(selectedMonth);
  }

  if (selectedMonth) {
    // Find the fiscal month that matches the selected label
    const targetMonth = fiscalMonths.find(fm => {
      const monthDate = new Date(fm.start_date);
      const formattedMonth = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      return formattedMonth === selectedMonth;
    });

    if (targetMonth) {
      return {
        startDate: new Date(targetMonth.start_date),
        endDate: targetMonth.end_date ? new Date(targetMonth.end_date) : new Date()
      };
    }
  }

  // Get current active fiscal month
  const activeMonth = fiscalMonths.find(fm => fm.is_active);
  if (activeMonth) {
    return {
      startDate: new Date(activeMonth.start_date),
      endDate: activeMonth.end_date ? new Date(activeMonth.end_date) : new Date()
    };
  }

  // Fallback to salary cycle
  return getSalaryCycleDates(selectedMonth);
};
