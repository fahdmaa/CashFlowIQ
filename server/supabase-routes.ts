import type { Express } from "express";
import { createServer, type Server } from "http";
import { SupabaseStorage } from "./supabase-storage";
import { insertTransactionSchema, insertBudgetSchema, updateBudgetSchema, insertCategorySchema } from "@shared/schema";
import { z } from "zod";
import { AuthenticatedRequest } from "./types";
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client and storage
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey);
const storage = new SupabaseStorage(supabaseUrl, supabaseServiceKey);

// Middleware to check authentication with Supabase
const requireAuth = async (req: AuthenticatedRequest, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabaseAuth.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    
    req.user = {
      id: user.id,
      username: user.email || user.user_metadata?.username || 'user'
    };
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid token" });
  }
};

export async function registerSupabaseRoutes(app: Express): Promise<Server> {
  // Authentication routes - Using Supabase Auth
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, username } = req.body;
      
      const { data, error } = await supabaseAuth.auth.signUp({
        email,
        password,
        options: {
          data: {
            username: username
          }
        }
      });
      
      if (error) {
        return res.status(400).json({ message: error.message });
      }
      
      if (data.user) {
        res.json({ 
          user: { 
            id: data.user.id, 
            username: username || email,
            email: email
          },
          session: data.session
        });
      } else {
        res.status(400).json({ message: "Failed to create user" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error during signup" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const { data, error } = await supabaseAuth.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        return res.status(401).json({ message: error.message });
      }
      
      if (data.user && data.session) {
        res.json({ 
          user: { 
            id: data.user.id, 
            username: data.user.user_metadata?.username || data.user.email,
            email: data.user.email
          },
          token: data.session.access_token,
          refresh_token: data.session.refresh_token
        });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      res.status(500).json({ message: "Server error during login" });
    }
  });

  app.post("/api/auth/logout", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        await supabaseAuth.auth.admin.signOut(token);
      }
      res.json({ message: "Logged out successfully" });
    } catch (error) {
      // Even if logout fails on server, client should clear tokens
      res.json({ message: "Logged out successfully" });
    }
  });

  app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ 
      user: req.user
    });
  });

  app.post("/api/auth/refresh", async (req, res) => {
    try {
      const { refresh_token } = req.body;
      
      const { data, error } = await supabaseAuth.auth.refreshSession({
        refresh_token
      });
      
      if (error) {
        return res.status(401).json({ message: error.message });
      }
      
      res.json({
        token: data.session?.access_token,
        refresh_token: data.session?.refresh_token,
        user: data.user
      });
    } catch (error) {
      res.status(500).json({ message: "Server error during token refresh" });
    }
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(req.user!.id, validatedData);
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        console.error('Error creating transaction:', error);
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.get("/api/transactions/category/:category", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.params;
      const transactions = await storage.getTransactionsByCategory(req.user!.id, category);
      res.json(transactions);
    } catch (error) {
      console.error('Error fetching transactions by category:', error);
      res.status(500).json({ message: "Failed to fetch transactions by category" });
    }
  });

  // Budgets
  app.get("/api/budgets", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const budgets = await storage.getBudgets(req.user!.id);
      res.json(budgets);
    } catch (error) {
      console.error('Error fetching budgets:', error);
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(req.user!.id, validatedData);
      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      } else {
        console.error('Error creating budget:', error);
        res.status(500).json({ message: "Failed to create budget" });
      }
    }
  });

  app.put("/api/budgets/:category", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { category } = req.params;
      const validatedData = updateBudgetSchema.parse(req.body);
      const budget = await storage.updateBudgetLimit(req.user!.id, category, validatedData.monthlyLimit);
      if (!budget) {
        return res.status(404).json({ message: "Budget not found" });
      }
      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      } else {
        console.error('Error updating budget:', error);
        res.status(500).json({ message: "Failed to update budget" });
      }
    }
  });

  // Categories
  app.get("/api/categories", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const categories = await storage.getCategories(req.user!.id);
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validated = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(req.user!.id, validated);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid category data", errors: error.errors });
      } else {
        console.error('Error creating category:', error);
        res.status(500).json({ message: "Failed to create category" });
      }
    }
  });

  // Insights
  app.get("/api/insights", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const insights = await storage.getInsights(req.user!.id);
      res.json(insights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.patch("/api/insights/:id/read", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.markInsightAsRead(req.user!.id, id);
      res.json({ success: true });
    } catch (error) {
      console.error('Error marking insight as read:', error);
      res.status(500).json({ message: "Failed to mark insight as read" });
    }
  });

  // Analytics
  app.get("/api/analytics/spending", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { days = 7 } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));
      
      const transactions = await storage.getTransactionsByDateRange(req.user!.id, startDate, endDate);
      const expenseTransactions = transactions.filter(t => t.type === "expense");
      
      // Group by date
      const dailySpending = new Map<string, number>();
      expenseTransactions.forEach(transaction => {
        const date = new Date(transaction.date).toISOString().split('T')[0];
        const current = dailySpending.get(date) || 0;
        dailySpending.set(date, current + parseFloat(transaction.amount));
      });

      res.json(Object.fromEntries(dailySpending));
    } catch (error) {
      console.error('Error fetching spending analytics:', error);
      res.status(500).json({ message: "Failed to fetch spending analytics" });
    }
  });

  app.get("/api/analytics/overview", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const monthlyTransactions = await storage.getTransactionsByDateRange(req.user!.id, startOfMonth, endOfMonth);
      
      const monthlyIncome = monthlyTransactions
        .filter(t => t.type === "income")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
      const monthlySpending = monthlyTransactions
        .filter(t => t.type === "expense")
        .reduce((sum, t) => sum + parseFloat(t.amount), 0);

      const currentBalance = monthlyIncome - monthlySpending;
      
      // Calculate savings goal progress (assuming goal is to save 20% of income)
      const savingsGoal = monthlyIncome * 0.2;
      const actualSavings = monthlyIncome - monthlySpending;
      const savingsProgress = savingsGoal > 0 ? Math.min((actualSavings / savingsGoal) * 100, 100) : 0;

      res.json({
        currentBalance,
        monthlyIncome,
        monthlySpending,
        savingsProgress: Math.round(savingsProgress)
      });
    } catch (error) {
      console.error('Error fetching overview analytics:', error);
      res.status(500).json({ message: "Failed to fetch overview analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}