import { type Transaction, type InsertTransaction, type Budget, type InsertBudget, type Insight, type InsertInsight, type Category, type InsertCategory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Transactions
  getTransactions(): Promise<Transaction[]>;
  getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]>;
  createTransaction(transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByCategory(category: string): Promise<Transaction[]>;

  // Budgets
  getBudgets(): Promise<Budget[]>;
  getBudgetByCategory(category: string): Promise<Budget | undefined>;
  createBudget(budget: InsertBudget): Promise<Budget>;
  updateBudgetSpent(category: string, amount: number): Promise<Budget | undefined>;
  updateBudgetLimit(category: string, monthlyLimit: string): Promise<Budget | undefined>;

  // Categories
  getCategories(): Promise<Category[]>;
  createCategory(category: InsertCategory): Promise<Category>;
  
  // Insights
  getInsights(): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  markInsightAsRead(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;
  private budgets: Map<string, Budget>;
  private categories: Map<string, Category>;
  private insights: Map<string, Insight>;

  constructor() {
    this.transactions = new Map();
    this.budgets = new Map();
    this.categories = new Map();
    this.insights = new Map();

    // Initialize with default data
    this.initializeDefaultCategories();
  }

  private async initializeDefaultCategories() {
    const defaultCategories: InsertCategory[] = [
      { name: "Food & Dining", type: "expense", color: "#F97316", icon: "Utensils" },
      { name: "Transportation", type: "expense", color: "#3B82F6", icon: "Car" },
      { name: "Entertainment", type: "expense", color: "#A855F7", icon: "Gamepad2" },
      { name: "Shopping", type: "expense", color: "#F43F5E", icon: "ShoppingBag" },
      { name: "Bills & Utilities", type: "expense", color: "#10B981", icon: "Home" },
      { name: "Income", type: "income", color: "#0EA5E9", icon: "Wallet" },
    ];

    const defaultLimits: Record<string, string> = {
      "Food & Dining": "600.00",
      Transportation: "400.00",
      Entertainment: "300.00",
      Shopping: "500.00",
      "Bills & Utilities": "800.00",
    };

    for (const category of defaultCategories) {
      await this.createCategory(category);
      if (category.type === "expense") {
        const limit = defaultLimits[category.name] || "0.00";
        await this.updateBudgetLimit(category.name, limit);
      }
    }
  }

  // Transactions
  async getTransactions(): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  }

  async getTransactionsByDateRange(startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return transactionDate >= startDate && transactionDate <= endDate;
      }
    );
  }

  async createTransaction(insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);

    // Update budget spent if it's an expense
    if (transaction.type === "expense") {
      await this.updateBudgetSpent(transaction.category, parseFloat(transaction.amount));
    }

    return transaction;
  }

  async getTransactionsByCategory(category: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.category === category
    );
  }

  // Budgets
  async getBudgets(): Promise<Budget[]> {
    return Array.from(this.budgets.values());
  }

  async getBudgetByCategory(category: string): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(
      (budget) => budget.category === category
    );
  }

  async createBudget(insertBudget: InsertBudget): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = {
      ...insertBudget,
      id,
      currentSpent: "0.00",
      createdAt: new Date(),
    };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudgetSpent(category: string, amount: number): Promise<Budget | undefined> {
    const budget = await this.getBudgetByCategory(category);
    if (budget) {
      const currentSpent = parseFloat(budget.currentSpent) + amount;
      budget.currentSpent = currentSpent.toFixed(2);
      this.budgets.set(budget.id, budget);
      return budget;
    }
    return undefined;
  }

  async updateBudgetLimit(category: string, monthlyLimit: string): Promise<Budget | undefined> {
    const budget = await this.getBudgetByCategory(category);
    if (budget) {
      budget.monthlyLimit = parseFloat(monthlyLimit).toFixed(2);
      this.budgets.set(budget.id, budget);
      return budget;
    }
    return undefined;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id, createdAt: new Date() };
    this.categories.set(id, category);
    if (category.type === "expense") {
      const existing = await this.getBudgetByCategory(category.name);
      if (!existing) {
        await this.createBudget({ category: category.name, monthlyLimit: "0.00" });
      }
    }
    return category;
  }

  // Insights
  async getInsights(): Promise<Insight[]> {
    return Array.from(this.insights.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createInsight(insertInsight: InsightInsert): Promise<Insight> {
    const id = randomUUID();
    const insight: Insight = {
      ...insertInsight,
      id,
      category: insertInsight.category || null,
      isRead: insertInsight.isRead || "false",
      createdAt: new Date(),
    };
    this.insights.set(id, insight);
    return insight;
  }

  async markInsightAsRead(id: string): Promise<void> {
    const insight = this.insights.get(id);
    if (insight) {
      insight.isRead = "true";
      this.insights.set(id, insight);
    }
  }
}

export const storage = new MemStorage();