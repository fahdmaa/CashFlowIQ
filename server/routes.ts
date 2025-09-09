import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertBudgetSchema, updateBudgetSchema, insertCategorySchema, loginSchema } from "@shared/schema";
import { z } from "zod";
import { AuthenticatedRequest } from "./types";
import { randomUUID } from "crypto";

// Simple token store for authentication
const activeTokens = new Map<string, string>(); // token -> userId

// Middleware to check authentication
const requireAuth = async (req: AuthenticatedRequest, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: "Authentication required" });
  }

  const token = authHeader.substring(7);
  const userId = activeTokens.get(token);
  
  if (!userId) {
    return res.status(401).json({ message: "Invalid token" });
  }
  
  const user = await storage.getUserById(userId);
  if (!user) {
    return res.status(401).json({ message: "User not found" });
  }
  
  req.user = {
    id: user.id,
    username: user.username
  };
  next();
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByUsername(username);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      // Generate auth token
      const token = randomUUID();
      activeTokens.set(token, user.id);
      
      res.json({ 
        user: { 
          id: user.id, 
          username: user.username 
        },
        token
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid request data", errors: error.errors });
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    }
  });

  app.post("/api/auth/logout", requireAuth, (req: AuthenticatedRequest, res) => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      activeTokens.delete(token);
    }
    res.json({ message: "Logged out successfully" });
  });

  app.get("/api/auth/me", requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ 
      user: req.user
    });
  });

  // Transactions
  app.get("/api/transactions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const transactions = await storage.getTransactions(req.user!.id);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(req.user!.id, validatedData);
      
      // Generate insights based on the new transaction
      await generateInsights(req.user!.id, transaction);
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
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
      res.status(500).json({ message: "Failed to fetch transactions by category" });
    }
  });

  // Budgets
  app.get("/api/budgets", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const budgets = await storage.getBudgets(req.user!.id);
      res.json(budgets);
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.patch("/api/insights/:id/read", requireAuth, async (req: AuthenticatedRequest, res) => {
    try {
      const { id } = req.params;
      await storage.markInsightAsRead(req.user!.id, id);
      res.json({ success: true });
    } catch (error) {
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
      
      // Group by date within range, initialize to 0 to avoid missing days
      const dailySpending = new Map<string, number>();
      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const key = new Date(d).toISOString().split('T')[0];
        dailySpending.set(key, 0);
      }
      expenseTransactions.forEach(transaction => {
        const key = new Date(transaction.date).toISOString().split('T')[0];
        const current = dailySpending.get(key) || 0;
        dailySpending.set(key, current + parseFloat(transaction.amount));
      });

      res.json(Object.fromEntries(dailySpending));
    } catch (error) {
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
      res.status(500).json({ message: "Failed to fetch overview analytics" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function generateInsights(userId: string, transaction: any) {
  const budgets = await storage.getBudgets(userId);
  const budget = budgets.find(b => b.category === transaction.category);
  
  if (budget && transaction.type === "expense") {
    const spentPercentage = (parseFloat(budget.currentSpent) / parseFloat(budget.monthlyLimit)) * 100;
    
    if (spentPercentage > 100) {
      await storage.createInsight(userId, {
        type: "warning",
        title: "Budget Exceeded",
        message: `You've exceeded your ${transaction.category} budget by DH${(parseFloat(budget.currentSpent) - parseFloat(budget.monthlyLimit)).toFixed(2)} this month.`,
        category: transaction.category,
        isRead: "false"
      });
    } else if (spentPercentage > 80) {
      await storage.createInsight(userId, {
        type: "warning",
        title: "Budget Alert",
        message: `You've used ${spentPercentage.toFixed(0)}% of your ${transaction.category} budget this month.`,
        category: transaction.category,
        isRead: "false"
      });
    }
  }
}
