/**
 * MongoDB Direct Client
 * Replaces supabase-direct.ts with MongoDB API calls
 */

import { authenticatedFetch } from './mongodb-auth';
import { normalizeAmount, normalizeDateToISO } from './normalize';

const API_URL = import.meta.env.VITE_API_URL || '/api';

// ==================== TRANSACTIONS ====================

export const getTransactions = async (selectedMonth?: string) => {
  const url = selectedMonth
    ? `${API_URL}/transactions?month=${encodeURIComponent(selectedMonth)}`
    : `${API_URL}/transactions`;

  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch transactions');
  }

  const data = await response.json();
  console.log(`Retrieved ${data.length} transactions for month: ${selectedMonth || 'all'}`);
  return data;
};

export const createTransaction = async (transaction: any) => {
  const amountStr = normalizeAmount(transaction.amount);
  if (!amountStr) {
    throw new Error('Amount must be a valid number (e.g., 28 or 28.00).');
  }

  const response = await authenticatedFetch(`${API_URL}/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: parseFloat(amountStr),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: normalizeDateToISO(transaction.date)
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create transaction');
  }

  return await response.json();
};

export const updateTransaction = async (transactionId: string, transaction: any) => {
  console.log(`updateTransaction called with ID: ${transactionId}`, transaction);

  const amountStr = normalizeAmount(transaction.amount);
  if (!amountStr) {
    throw new Error('Amount must be a valid number (e.g., 28 or 28.00).');
  }

  const response = await authenticatedFetch(`${API_URL}/transactions/${transactionId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: parseFloat(amountStr),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: normalizeDateToISO(transaction.date)
    })
  });

  console.log('Update transaction result:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('Update error:', error);
    throw new Error(error.error || 'Failed to update transaction');
  }

  const data = await response.json();
  console.log('Transaction updated successfully:', data);
  return data;
};

export const deleteTransaction = async (transactionId: string) => {
  console.log(`deleteTransaction called with ID: ${transactionId}`);

  const response = await authenticatedFetch(`${API_URL}/transactions/${transactionId}`, {
    method: 'DELETE'
  });

  console.log('Delete transaction result:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('Delete error:', error);
    throw new Error(error.error || 'Failed to delete transaction');
  }

  const data = await response.json();
  console.log('Transaction deleted successfully:', data);
  return data;
};

// ==================== CATEGORIES ====================

export const getCategories = async () => {
  console.log('getCategories: Fetching categories...');

  const response = await authenticatedFetch(`${API_URL}/categories`);

  console.log('getCategories: Response status:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('getCategories: Error fetching categories:', error);
    throw new Error(error.error || 'Failed to fetch categories');
  }

  const data = await response.json();
  console.log('getCategories: Returning categories:', data.length, 'items');
  return data;
};

export const createCategory = async (category: any) => {
  console.log('createCategory called with:', category);

  const response = await authenticatedFetch(`${API_URL}/categories`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    })
  });

  console.log('Category creation result:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('Category creation error:', error);
    throw new Error(error.error || 'Failed to create category');
  }

  const data = await response.json();
  console.log('Category created successfully:', data);
  return data;
};

export const updateCategory = async (categoryId: string, newName: string) => {
  console.log(`updateCategory called with categoryId: ${categoryId}, newName: ${newName}`);

  const response = await authenticatedFetch(`${API_URL}/categories/${categoryId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: newName })
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Category update error:', error);
    throw new Error(error.error || 'Failed to update category');
  }

  const data = await response.json();
  console.log('Category updated successfully:', data);
  return data;
};

export const deleteCategory = async (categoryId: string) => {
  const response = await authenticatedFetch(`${API_URL}/categories/${categoryId}`, {
    method: 'DELETE'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete category');
  }

  return await response.json();
};

// ==================== BUDGETS ====================

export const getBudgets = async (selectedMonth?: string) => {
  const url = selectedMonth
    ? `${API_URL}/budgets?month=${encodeURIComponent(selectedMonth)}`
    : `${API_URL}/budgets`;

  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch budgets');
  }

  const data = await response.json();
  console.log('Budgets data from MongoDB:', data);
  return data;
};

export const createBudget = async (budget: any) => {
  const response = await authenticatedFetch(`${API_URL}/budgets`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      category: budget.category,
      monthlyLimit: parseFloat(budget.monthlyLimit)
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create budget');
  }

  return await response.json();
};

export const updateBudget = async (category: string, monthlyLimit: number) => {
  const response = await authenticatedFetch(`${API_URL}/budgets/${encodeURIComponent(category)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ monthlyLimit })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update budget');
  }

  return await response.json();
};

export const deleteBudget = async (budgetId: string) => {
  console.log(`deleteBudget called with budgetId: ${budgetId}`);

  const response = await authenticatedFetch(`${API_URL}/budgets/${budgetId}`, {
    method: 'DELETE'
  });

  console.log('Delete budget result:', response.status);

  if (!response.ok) {
    const error = await response.json();
    console.error('Budget delete error:', error);
    throw new Error(error.error || 'Failed to delete budget');
  }

  const data = await response.json();
  console.log('Budget deleted successfully:', data);
  return data;
};

// ==================== ANALYTICS ====================

export const getOverviewAnalytics = async (selectedMonth?: string) => {
  const url = selectedMonth
    ? `${API_URL}/analytics/overview?month=${encodeURIComponent(selectedMonth)}`
    : `${API_URL}/analytics/overview`;

  const response = await authenticatedFetch(url);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch analytics');
  }

  return await response.json();
};

export const getSpendingAnalytics = async (days: number = 7, selectedMonth?: string) => {
  console.log(`getSpendingAnalytics called for ${days} days, month: ${selectedMonth}`);

  let url = `${API_URL}/analytics/spending?days=${days}`;
  if (selectedMonth) {
    url += `&month=${encodeURIComponent(selectedMonth)}`;
  }

  const response = await authenticatedFetch(url);

  console.log(`Spending analytics response status: ${response.status}`);

  if (!response.ok) {
    const error = await response.json();
    console.error('Error fetching spending analytics:', error);
    throw new Error(error.error || 'Failed to fetch spending analytics');
  }

  const data = await response.json();
  console.log(`Found spending data:`, data);

  return data;
};

// ==================== INSIGHTS ====================

export const getInsights = async () => {
  const response = await authenticatedFetch(`${API_URL}/insights`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch insights');
  }

  return await response.json();
};

export const markInsightAsRead = async (insightId: string) => {
  const response = await authenticatedFetch(`${API_URL}/insights/${insightId}/read`, {
    method: 'PUT'
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to mark insight as read');
  }

  return await response.json();
};

// ==================== USER PROFILE ====================

export const getUserProfile = async () => {
  const response = await authenticatedFetch(`${API_URL}/auth/me`);

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to fetch user profile');
  }

  return await response.json();
};

export const updateUserProfile = async (updates: { username?: string; profile_picture_url?: string | null }) => {
  console.log('updateUserProfile called with updates:', updates);

  const response = await authenticatedFetch(`${API_URL}/auth/me`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updates)
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Profile update error:', error);
    throw new Error(error.error || 'Failed to update profile');
  }

  const data = await response.json();
  console.log('Profile updated successfully:', data);
  return data;
};

// Cleanup functions (not needed for MongoDB but kept for compatibility)
export const cleanupDuplicateBudgets = async () => {
  console.log('cleanupDuplicateBudgets: Not needed for MongoDB');
  return { success: true };
};

export const cleanupOrphanedCategories = async () => {
  console.log('cleanupOrphanedCategories: Not needed for MongoDB');
  return { cleanedUp: 0, categories: [] };
};

// Fiscal month functions (using salary cycle as default)
export const getCurrentFiscalMonth = async () => {
  return null; // Always use salary cycle for now
};

export const startNewFiscalMonth = async () => {
  throw new Error('Fiscal months not yet implemented for MongoDB');
};

export const getFiscalMonthForDate = async (date: Date) => {
  return null;
};

export const getFiscalCycleDates = async (selectedMonth?: string) => {
  // This is handled server-side
  return { startDate: new Date(), endDate: new Date() };
};

// Profile picture functions (will need storage implementation)
export const uploadProfilePicture = async (file: File) => {
  throw new Error('Profile picture upload not yet implemented for MongoDB');
};

export const deleteProfilePicture = async () => {
  throw new Error('Profile picture delete not yet implemented for MongoDB');
};
