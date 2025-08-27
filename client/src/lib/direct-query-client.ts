import { QueryClient, QueryFunction } from "@tanstack/react-query";
import { getTransactions, createTransaction, getCategories, createCategory, getOverviewAnalytics, getBudgets, createBudget, updateBudget, cleanupDuplicateBudgets } from "./supabase-direct";

// Direct Supabase query function
const getDirectQueryFn: QueryFunction = async ({ queryKey }) => {
  const [route] = queryKey as string[];
  
  try {
    switch (route) {
      case "/api/transactions":
        return await getTransactions();
      
      case "/api/categories":
        return await getCategories();
      
      case "/api/budgets":
        return await getBudgets();
      
      case "/api/analytics/overview":
        return await getOverviewAnalytics();
      
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
  
  if (method === 'POST' && url === '/api/categories') {
    return await createCategory(data);
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