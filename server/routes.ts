import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTransactionSchema, insertBudgetSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Transactions
  app.get("/api/transactions", async (req, res) => {
    try {
      const transactions = await storage.getTransactions();
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/transactions", async (req, res) => {
    try {
      const validatedData = insertTransactionSchema.parse(req.body);
      const transaction = await storage.createTransaction(validatedData);
      
      // Generate insights based on the new transaction
      await generateInsights(transaction);
      
      res.json(transaction);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid transaction data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create transaction" });
      }
    }
  });

  app.get("/api/transactions/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const transactions = await storage.getTransactionsByCategory(category);
      res.json(transactions);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch transactions by category" });
    }
  });

  // Budgets
  app.get("/api/budgets", async (req, res) => {
    try {
      const budgets = await storage.getBudgets();
      res.json(budgets);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch budgets" });
    }
  });

  app.post("/api/budgets", async (req, res) => {
    try {
      const validatedData = insertBudgetSchema.parse(req.body);
      const budget = await storage.createBudget(validatedData);
      res.json(budget);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid budget data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create budget" });
      }
    }
  });

  // Insights
  app.get("/api/insights", async (req, res) => {
    try {
      const insights = await storage.getInsights();
      res.json(insights);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch insights" });
    }
  });

  app.patch("/api/insights/:id/read", async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markInsightAsRead(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to mark insight as read" });
    }
  });

  // Analytics
  app.get("/api/analytics/spending", async (req, res) => {
    try {
      const { days = 7 } = req.query;
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days as string));
      
      const transactions = await storage.getTransactionsByDateRange(startDate, endDate);
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
      res.status(500).json({ message: "Failed to fetch spending analytics" });
    }
  });

  app.get("/api/analytics/overview", async (req, res) => {
    try {
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      const monthlyTransactions = await storage.getTransactionsByDateRange(startOfMonth, endOfMonth);
      
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

async function generateInsights(transaction: any) {
  const budgets = await storage.getBudgets();
  const budget = budgets.find(b => b.category === transaction.category);
  
  if (budget && transaction.type === "expense") {
    const spentPercentage = (parseFloat(budget.currentSpent) / parseFloat(budget.monthlyLimit)) * 100;
    
    if (spentPercentage > 100) {
      await storage.createInsight({
        type: "warning",
        title: "Budget Exceeded",
        message: `You've exceeded your ${transaction.category} budget by $${(parseFloat(budget.currentSpent) - parseFloat(budget.monthlyLimit)).toFixed(2)} this month.`,
        category: transaction.category,
        isRead: "false"
      });
    } else if (spentPercentage > 80) {
      await storage.createInsight({
        type: "warning",
        title: "Budget Alert",
        message: `You've used ${spentPercentage.toFixed(0)}% of your ${transaction.category} budget this month.`,
        category: transaction.category,
        isRead: "false"
      });
    }
  }
}
