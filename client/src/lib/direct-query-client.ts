import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, getCategories, createCategory, updateCategory, deleteCategory, deleteBudget, getOverviewAnalytics, getSpendingAnalytics, getBudgets, createBudget, updateBudget, cleanupDuplicateBudgets, cleanupOrphanedCategories } from "./mongodb-direct";

// Direct Supabase query function
const getDirectQueryFn: QueryFunction = async ({ queryKey }) => {
  const [route, params] = queryKey as [string, any?];
  
  try {
    switch (route) {
      case "/api/transactions":
        const transactionMonth = params?.selectedMonth;
        console.log(`Query function: Calling getTransactions with month: ${transactionMonth}`);
        return await getTransactions(transactionMonth);
      
      case "/api/categories":
        return await getCategories();
      
      case "/api/budgets":
        const budgetMonth = params?.selectedMonth;
        console.log(`Query function: Calling getBudgets with month: ${budgetMonth}`);
        return await getBudgets(budgetMonth);
      
      case "/api/analytics/overview":
        const selectedMonth = params?.selectedMonth;
        console.log(`Query function: Calling getOverviewAnalytics with month: ${selectedMonth}`);
        return await getOverviewAnalytics(selectedMonth);
      
      case "/api/analytics/spending":
        const days = params?.days || 7;
        const spendingMonth = params?.selectedMonth;
        console.log(`Query function: Calling getSpendingAnalytics with ${days} days, month: ${spendingMonth}`);
        return await getSpendingAnalytics(days, spendingMonth);
      
      // Add more routes as needed
      default:
        throw new Error(`Unknown route: ${route}`);
    }
  } catch (error: any) {
    // Handle auth errors by redirecting to login
    if (error.message.includes('JWT') || error.message.includes('auth')) {
      window.location.href = '/login';
      return null;
    }
    throw error;
  }
};

// API request function for mutations (like creating transactions)
export async function directApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<any> {
  
  if (method === 'POST' && url === '/api/transactions') {
    return await createTransaction(data);
  }
  
  if (method === 'PUT' && url === '/api/transactions') {
    const { transactionId, ...transactionData } = data as any;
    console.log(`Direct API request - updating transaction: ${transactionId}`, transactionData);
    return await updateTransaction(transactionId, transactionData);
  }
  
  if (method === 'DELETE' && url === '/api/transactions') {
    const { transactionId } = data as any;
    console.log(`Direct API request - deleting transaction: ${transactionId}`);
    return await deleteTransaction(transactionId);
  }
  
  if (method === 'POST' && url === '/api/categories') {
    return await createCategory(data);
  }
  
  if (method === 'PUT' && url === '/api/categories') {
    const { categoryId, newName } = data as any;
    console.log(`Direct API request - updating category: ${categoryId} to ${newName}`);
    return await updateCategory(categoryId, newName);
  }
  
  if (method === 'DELETE' && url === '/api/categories') {
    const { categoryId } = data as any;
    console.log(`Direct API request - deleting category: ${categoryId}`);
    return await deleteCategory(categoryId);
  }
  
  if (method === 'DELETE' && url === '/api/budgets') {
    const { budgetId } = data as any;
    console.log(`Direct API request - deleting budget: ${budgetId}`);
    return await deleteBudget(budgetId);
  }
  
  if (method === 'POST' && url === '/api/budgets') {
    return await createBudget(data);
  }
  
  if (method === 'PUT' && url === '/api/budgets') {
    const { category, monthlyLimit } = data as any;
    console.log(`Direct API request - updating budget for "${category}" with limit: ${monthlyLimit}`);
    return await updateBudget(category, monthlyLimit);
  }
  
  if (method === 'POST' && url === '/api/budgets/cleanup') {
    console.log('Direct API request - cleaning up duplicate budgets');
    return await cleanupDuplicateBudgets();
  }
  
  if (method === 'POST' && url === '/api/categories/cleanup') {
    console.log('Direct API request - cleaning up orphaned categories');
    return await cleanupOrphanedCategories();
  }
  
  // Add more mutation handlers as needed
  throw new Error(`Unsupported direct API request: ${method} ${url}`);
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getDirectQueryFn,
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error.message.includes('JWT') || error.message.includes('auth')) {
          return false;
        }
        return failureCount < 3;
      },
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry on auth errors
        if (error.message.includes('JWT') || error.message.includes('auth')) {
          return false;
        }
        return failureCount < 3;
      },
    },
  },
});