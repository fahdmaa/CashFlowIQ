import PocketBase from 'pocketbase';
import { type User, type InsertUser, type Transaction, type InsertTransaction, type Budget, type InsertBudget, type Insight, type InsertInsight, type Category, type InsertCategory } from "@shared/schema";
import { IStorage } from "./storage";

export class PocketBaseStorage implements IStorage {
  private pb: PocketBase;

  constructor(pbUrl = 'http://127.0.0.1:8090') {
    this.pb = new PocketBase(pbUrl);
  }

  // Helper method to authenticate as admin for server-side operations
  private async authenticateAsAdmin() {
    try {
      await this.pb.admins.authWithPassword('admin@cashflowiq.com', 'admin123456');
    } catch (error) {
      console.error('Failed to authenticate as admin:', error);
    }
  }

  // Users
  async createUser(user: InsertUser): Promise<User> {
    await this.authenticateAsAdmin();
    const record = await this.pb.collection('users').create({
      username: user.username,
      password: user.password,
      passwordConfirm: user.password,
    });
    
    return {
      id: record.id,
      username: record.username,
      password: record.password,
      createdAt: new Date(record.created)
    };
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    await this.authenticateAsAdmin();
    try {
      const record = await this.pb.collection('users').getFirstListItem(`username="${username}"`);
      return {
        id: record.id,
        username: record.username,
        password: record.password,
        createdAt: new Date(record.created)
      };
    } catch (error) {
      return undefined;
    }
  }

  async getUserById(id: string): Promise<User | undefined> {
    await this.authenticateAsAdmin();
    try {
      const record = await this.pb.collection('users').getOne(id);
      return {
        id: record.id,
        username: record.username,
        password: record.password,
        createdAt: new Date(record.created)
      };
    } catch (error) {
      return undefined;
    }
  }

  // Transactions
  async getTransactions(userId: string): Promise<Transaction[]> {
    await this.authenticateAsAdmin();
    const records = await this.pb.collection('transactions').getFullList({
      filter: `user="${userId}"`,
      sort: '-created'
    });

    return records.map(record => ({
      id: record.id,
      userId: record.user,
      amount: record.amount.toString(),
      description: record.description,
      category: record.category,
      type: record.type,
      date: new Date(record.date),
      createdAt: new Date(record.created)
    }));
  }

  async getTransactionsByDateRange(userId: string, startDate: Date, endDate: Date): Promise<Transaction[]> {
    await this.authenticateAsAdmin();
    const records = await this.pb.collection('transactions').getFullList({
      filter: `user="${userId}" && date >= "${startDate.toISOString().split('T')[0]}" && date <= "${endDate.toISOString().split('T')[0]}"`,
      sort: '-created'
    });

    return records.map(record => ({
      id: record.id,
      userId: record.user,
      amount: record.amount.toString(),
      description: record.description,
      category: record.category,
      type: record.type,
      date: new Date(record.date),
      createdAt: new Date(record.created)
    }));
  }

  async createTransaction(userId: string, transaction: InsertTransaction): Promise<Transaction> {
    await this.authenticateAsAdmin();
    const record = await this.pb.collection('transactions').create({
      user: userId,
      amount: parseFloat(transaction.amount),
      description: transaction.description,
      category: transaction.category,
      type: transaction.type,
      date: transaction.date.toISOString().split('T')[0]
    });

    return {
      id: record.id,
      userId: record.user,
      amount: record.amount.toString(),
      description: record.description,
      category: record.category,
      type: record.type,
      date: new Date(record.date),
      createdAt: new Date(record.created)
    };
  }

  async getTransactionsByCategory(userId: string, category: string): Promise<Transaction[]> {
    await this.authenticateAsAdmin();
    const records = await this.pb.collection('transactions').getFullList({
      filter: `user="${userId}" && category="${category}"`,
      sort: '-created'
    });

    return records.map(record => ({
      id: record.id,
      userId: record.user,
      amount: record.amount.toString(),
      description: record.description,
      category: record.category,
      type: record.type,
      date: new Date(record.date),
      createdAt: new Date(record.created)
    }));
  }

  // Budgets
  async getBudgets(userId: string): Promise<Budget[]> {
    await this.authenticateAsAdmin();
    const records = await this.pb.collection('budgets').getFullList({
      filter: `user="${userId}"`
    });

    return records.map(record => ({
      id: record.id,
      userId: record.user,
      category: record.category,
      monthlyLimit: record.monthly_limit.toString(),
      currentSpent: (record.current_spent || 0).toString(),
      createdAt: new Date(record.created)
    }));
  }

  async getBudgetByCategory(userId: string, category: string): Promise<Budget | undefined> {
    await this.authenticateAsAdmin();
    try {
      const record = await this.pb.collection('budgets').getFirstListItem(`user="${userId}" && category="${category}"`);
      return {
        id: record.id,
        userId: record.user,
        category: record.category,
        monthlyLimit: record.monthly_limit.toString(),
        currentSpent: (record.current_spent || 0).toString(),
        createdAt: new Date(record.created)
      };
    } catch (error) {
      return undefined;
    }
  }

  async createBudget(userId: string, budget: InsertBudget): Promise<Budget> {
    await this.authenticateAsAdmin();
    const record = await this.pb.collection('budgets').create({
      user: userId,
      category: budget.category,
      monthly_limit: parseFloat(budget.monthlyLimit),
      current_spent: 0
    });

    return {
      id: record.id,
      userId: record.user,
      category: record.category,
      monthlyLimit: record.monthly_limit.toString(),
      currentSpent: (record.current_spent || 0).toString(),
      createdAt: new Date(record.created)
    };
  }

  async updateBudgetSpent(userId: string, category: string, amount: number): Promise<Budget | undefined> {
    const budget = await this.getBudgetByCategory(userId, category);
    if (!budget) return undefined;

    await this.authenticateAsAdmin();
    const newSpent = parseFloat(budget.currentSpent) + amount;
    const record = await this.pb.collection('budgets').update(budget.id, {
      current_spent: newSpent
    });

    return {
      id: record.id,
      userId: record.user,
      category: record.category,
      monthlyLimit: record.monthly_limit.toString(),
      currentSpent: record.current_spent.toString(),
      createdAt: new Date(record.created)
    };
  }

  async updateBudgetLimit(userId: string, category: string, monthlyLimit: string): Promise<Budget | undefined> {
    const budget = await this.getBudgetByCategory(userId, category);
    if (!budget) return undefined;

    await this.authenticateAsAdmin();
    const record = await this.pb.collection('budgets').update(budget.id, {
      monthly_limit: parseFloat(monthlyLimit)
    });

    return {
      id: record.id,
      userId: record.user,
      category: record.category,
      monthlyLimit: record.monthly_limit.toString(),
      currentSpent: (record.current_spent || 0).toString(),
      createdAt: new Date(record.created)
    };
  }

  // Categories
  async getCategories(userId: string): Promise<Category[]> {
    await this.authenticateAsAdmin();
    const records = await this.pb.collection('categories').getFullList({
      filter: `user="${userId}"`
    });

    return records.map(record => ({
      id: record.id,
      userId: record.user,
      name: record.name,
      type: record.type,
      color: record.color,
      icon: record.icon,
      createdAt: new Date(record.created)
    }));
  }

  async createCategory(userId: string, category: InsertCategory): Promise<Category> {
    await this.authenticateAsAdmin();
    const record = await this.pb.collection('categories').create({
      user: userId,
      name: category.name,
      type: category.type,
      color: category.color,
      icon: category.icon
    });

    return {
      id: record.id,
      userId: record.user,
      name: record.name,
      type: record.type,
      color: record.color,
      icon: record.icon,
      createdAt: new Date(record.created)
    };
  }

  // Insights
  async getInsights(userId: string): Promise<Insight[]> {
    await this.authenticateAsAdmin();
    const records = await this.pb.collection('insights').getFullList({
      filter: `user="${userId}"`,
      sort: '-created'
    });

    return records.map(record => ({
      id: record.id,
      userId: record.user,
      type: record.type,
      title: record.title,
      message: record.message,
      category: record.category || null,
      isRead: record.is_read ? "true" : "false",
      createdAt: new Date(record.created)
    }));
  }

  async createInsight(userId: string, insight: InsertInsight): Promise<Insight> {
    await this.authenticateAsAdmin();
    const record = await this.pb.collection('insights').create({
      user: userId,
      type: insight.type,
      title: insight.title,
      message: insight.message,
      category: insight.category,
      is_read: insight.isRead === "true"
    });

    return {
      id: record.id,
      userId: record.user,
      type: record.type,
      title: record.title,
      message: record.message,
      category: record.category || null,
      isRead: record.is_read ? "true" : "false",
      createdAt: new Date(record.created)
    };
  }

  async markInsightAsRead(userId: string, id: string): Promise<void> {
    await this.authenticateAsAdmin();
    // First verify the insight belongs to the user
    try {
      const record = await this.pb.collection('insights').getOne(id);
      if (record.user === userId) {
        await this.pb.collection('insights').update(id, { is_read: true });
      }
    } catch (error) {
      // Insight not found or doesn't belong to user
    }
  }

  // Authentication methods for PocketBase integration
  async authenticateUser(username: string, password: string): Promise<User | null> {
    try {
      const authData = await this.pb.collection('users').authWithPassword(username, password);
      return {
        id: authData.record.id,
        username: authData.record.username,
        password: '', // Don't expose password
        createdAt: new Date(authData.record.created)
      };
    } catch (error) {
      return null;
    }
  }

  getPocketBaseInstance(): PocketBase {
    return this.pb;
  }
}