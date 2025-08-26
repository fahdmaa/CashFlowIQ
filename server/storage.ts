import { type User, type InsertUser, type Transaction, type InsertTransaction, type Budget, type InsertBudget, type Insight, type InsertInsight, type Category, type InsertCategory } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Users
  createUser(user: InsertUser): Promise<User>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserById(id: string): Promise<User | undefined>;

  // Transactions
  getTransactions(userId: string): Promise<Transaction[]>;
  getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]>;
  createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction>;
  getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]>;

  // Budgets
  getBudgets(userId: string): Promise<Budget[]>;
  getBudgetByCategory(userId: string, category: string): Promise<Budget | undefined>;
  createBudget(userId: string, budget: InsertBudget): Promise<Budget>;
  updateBudgetSpent(userId: string, category: string, amount: number): Promise<Budget | undefined>;
  updateBudgetLimit(userId: string, category: string, monthlyLimit: string): Promise<Budget | undefined>;

  // Categories
  getCategories(userId: string): Promise<Category[]>;
  createCategory(userId: string, category: InsertCategory): Promise<Category>;
  
  // Insights
  getInsights(userId: string): Promise<Insight[]>;
  createInsight(userId: string, insight: InsertInsight): Promise<Insight>;
  markInsightAsRead(userId: string, id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private transactions: Map<string, Transaction>;
  private budgets: Map<string, Budget>;
  private categories: Map<string, Category>;
  private insights: Map<string, Insight>;

  constructor() {
    this.users = new Map();
    this.transactions = new Map();
    this.budgets = new Map();
    this.categories = new Map();
    this.insights = new Map();

    // Initialize with default users and data
    this.initializeDefaultUsers();
  }

  private async initializeDefaultUsers() {
    // Create default users
    const user1 = await this.createUser({ username: "fahdmaa", password: "fahdmaa123" });
    const user2 = await this.createUser({ username: "farahfa", password: "farahfa123" });

    // Initialize default categories for both users
    await this.initializeDefaultCategories(user1.id);
    await this.initializeDefaultCategories(user2.id);
  }

  private async initializeDefaultCategories(userId: string) {
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
      await this.createCategory(userId, category);
      if (category.type === "expense") {
        const limit = defaultLimits[category.name] || "0.00";
        await this.updateBudgetLimit(userId, category.name, limit);
      }
    }
  }

  // Users
  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values())
      .filter(transaction => transaction.userId === userId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => {
        const transactionDate = new Date(transaction.date);
        return transaction.userId === userId && transactionDate >= startDate && transactionDate <= endDate;
      }
    );
  }

  async createTransaction(userId: string, insertTransaction: InsertTransaction): Promise<Transaction> {
    const id = randomUUID();
    const transaction: Transaction = {
      ...insertTransaction,
      id,
      userId,
      createdAt: new Date(),
    };
    this.transactions.set(id, transaction);

    // Update budget spent if it's an expense
    if (transaction.type === "expense") {
      await this.updateBudgetSpent(userId, transaction.category, parseFloat(transaction.amount));
    }

    return transaction;
  }

  async getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]> {
    return Array.from(this.transactions.values()).filter(
      (transaction) => transaction.userId === userId && transaction.category === category
    );
  }

  // Budgets
  async getBudgets(userId: string): Promise<Budget[]> {
    return Array.from(this.budgets.values()).filter(budget => budget.userId === userId);
  }

  async getBudgetByCategory(userId: string, category: string): Promise<Budget | undefined> {
    return Array.from(this.budgets.values()).find(
      (budget) => budget.userId === userId && budget.category === category
    );
  }

  async createBudget(userId: string, insertBudget: InsertBudget): Promise<Budget> {
    const id = randomUUID();
    const budget: Budget = {
      ...insertBudget,
      id,
      userId,
      currentSpent: "0.00",
      createdAt: new Date(),
    };
    this.budgets.set(id, budget);
    return budget;
  }

  async updateBudgetSpent(userId: string, category: string, amount: number): Promise<Budget | undefined> {
    const budget = await this.getBudgetByCategory(userId, category);
    if (budget) {
      const currentSpent = parseFloat(budget.currentSpent) + amount;
      budget.currentSpent = currentSpent.toFixed(2);
      this.budgets.set(budget.id, budget);
      return budget;
    }
    return undefined;
  }

  async updateBudgetLimit(userId: string, category: string, monthlyLimit: string): Promise<Budget | undefined> {
    const budget = await this.getBudgetByCategory(userId, category);
    if (budget) {
      budget.monthlyLimit = parseFloat(monthlyLimit).toFixed(2);
      this.budgets.set(budget.id, budget);
      return budget;
    }
    return undefined;
  }

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    return Array.from(this.categories.values()).filter(category => category.userId === userId);
  }

  async createCategory(userId: string, insertCategory: InsertCategory): Promise<Category> {
    const id = randomUUID();
    const category: Category = { ...insertCategory, id, userId, createdAt: new Date() };
    this.categories.set(id, category);
    if (category.type === "expense") {
      const existing = await this.getBudgetByCategory(userId, category.name);
      if (!existing) {
        await this.createBudget(userId, { category: category.name, monthlyLimit: "0.00" });
      }
    }
    return category;
  }

  // Insights
  async getInsights(userId: string): Promise<Insight[]> {
    return Array.from(this.insights.values())
      .filter(insight => insight.userId === userId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async createInsight(userId: string, insertInsight: InsertInsight): Promise<Insight> {
    const id = randomUUID();
    const insight: Insight = {
      ...insertInsight,
      id,
      userId,
      category: insertInsight.category || null,
      isRead: insertInsight.isRead || "false",
      createdAt: new Date(),
    };
    this.insights.set(id, insight);
    return insight;
  }

  async markInsightAsRead(userId: string, id: string): Promise<void> {
    const insight = this.insights.get(id);
    if (insight && insight.userId === userId) {
      insight.isRead = "true";
      this.insights.set(id, insight);
    }
  }
}

export const storage = new MemStorage();