import { type Transaction, type InsertTransaction, type Budget, type InsertBudget, type Insight, type InsertInsight } from "@shared/schema";
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
  
  // Insights
  getInsights(): Promise<Insight[]>;
  createInsight(insight: InsertInsight): Promise<Insight>;
  markInsightAsRead(id: string): Promise<void>;
}

export class MemStorage implements IStorage {
  private transactions: Map<string, Transaction>;
  private budgets: Map<string, Budget>;
  private insights: Map<string, Insight>;

  constructor() {
    this.transactions = new Map();
    this.budgets = new Map();
    this.insights = new Map();
    
    // Initialize with default budgets
    this.initializeDefaultBudgets();
  }

  private async initializeDefaultBudgets() {
    const defaultBudgets = [
      { category: "Food & Dining", monthlyLimit: "600.00" },
      { category: "Transportation", monthlyLimit: "400.00" },
      { category: "Entertainment", monthlyLimit: "300.00" },
      { category: "Shopping", monthlyLimit: "500.00" },
      { category: "Bills & Utilities", monthlyLimit: "800.00" },
    ];

    for (const budget of defaultBudgets) {
      await this.createBudget(budget);
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

  // Insights
  async getInsights(): Promise<Insight[]> {
    return Array.from(this.insights.values()).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  async createInsight(insertInsight: InsertInsight): Promise<Insight> {
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
