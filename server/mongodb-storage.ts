import { getCollection, toObjectId, toString } from './mongodb-connection';
import { ObjectId } from 'mongodb';

// TypeScript interfaces for our collections
interface Category {
  _id: ObjectId;
  user_id: ObjectId;
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
  created_at: Date;
  updated_at: Date;
}

interface Budget {
  _id: ObjectId;
  user_id: ObjectId;
  category: string;
  monthly_limit: number;
  current_spent: number;
  created_at: Date;
  updated_at: Date;
}

interface Transaction {
  _id: ObjectId;
  user_id: ObjectId;
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'savings';
  date: Date;
  created_at: Date;
  updated_at: Date;
}

interface Insight {
  _id: ObjectId;
  user_id: ObjectId;
  type: 'warning' | 'success' | 'info';
  title: string;
  message: string;
  category?: string;
  is_read: boolean;
  created_at: Date;
  updated_at: Date;
}

// Helper function to calculate salary cycle dates (27th to 26th)
function getSalaryCycleDates(selectedMonth?: string) {
  let targetDate: Date;

  if (selectedMonth) {
    const [year, month] = selectedMonth.split('-').map(Number);
    targetDate = new Date(year, month - 1, 1);
  } else {
    const today = new Date();
    const currentDay = today.getDate();

    if (currentDay >= 27) {
      targetDate = new Date(today.getFullYear(), today.getMonth() + 1, 1);
    } else {
      targetDate = new Date(today.getFullYear(), today.getMonth(), 1);
    }
  }

  const year = targetDate.getFullYear();
  const month = targetDate.getMonth();

  const startDate = new Date(year, month - 1, 27, 0, 0, 0, 0);
  const endDate = new Date(year, month, 26, 23, 59, 59, 999);

  return { startDate, endDate };
}

// ==================== CATEGORIES ====================

export async function getCategories(userId: string) {
  const collection = getCollection<Category>('categories');
  const categories = await collection
    .find({ user_id: toObjectId(userId) })
    .sort({ name: 1 })
    .toArray();

  return categories.map(cat => ({
    id: toString(cat._id),
    user_id: toString(cat.user_id),
    name: cat.name,
    type: cat.type,
    color: cat.color,
    icon: cat.icon,
    created_at: cat.created_at,
    updated_at: cat.updated_at
  }));
}

export async function createCategory(userId: string, categoryData: {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}) {
  const collection = getCollection<Category>('categories');

  const newCategory: Omit<Category, '_id'> = {
    user_id: toObjectId(userId),
    name: categoryData.name,
    type: categoryData.type,
    color: categoryData.color,
    icon: categoryData.icon,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(newCategory as Category);
  const category = await collection.findOne({ _id: result.insertedId });

  if (!category) throw new Error('Failed to create category');

  // Auto-create budget for expense categories
  if (categoryData.type === 'expense') {
    await createBudget(userId, {
      category: categoryData.name,
      monthlyLimit: 500 // Default budget
    });
  }

  return {
    id: toString(category._id),
    user_id: toString(category.user_id),
    name: category.name,
    type: category.type,
    color: category.color,
    icon: category.icon,
    created_at: category.created_at,
    updated_at: category.updated_at
  };
}

export async function updateCategory(userId: string, categoryId: string, newName: string) {
  const collection = getCollection<Category>('categories');

  // Get current category
  const currentCategory = await collection.findOne({
    _id: toObjectId(categoryId),
    user_id: toObjectId(userId)
  });

  if (!currentCategory) {
    throw new Error('Category not found');
  }

  const oldName = currentCategory.name;

  // Update category name
  const result = await collection.findOneAndUpdate(
    { _id: toObjectId(categoryId), user_id: toObjectId(userId) },
    { $set: { name: newName, updated_at: new Date() } },
    { returnDocument: 'after' }
  );

  if (!result) throw new Error('Category not found');

  // Update associated budgets
  await getCollection('budgets').updateMany(
    { user_id: toObjectId(userId), category: oldName },
    { $set: { category: newName, updated_at: new Date() } }
  );

  // Update associated transactions
  await getCollection('transactions').updateMany(
    { user_id: toObjectId(userId), category: oldName },
    { $set: { category: newName, updated_at: new Date() } }
  );

  return {
    id: toString(result._id),
    user_id: toString(result.user_id),
    name: result.name,
    type: result.type,
    color: result.color,
    icon: result.icon,
    created_at: result.created_at,
    updated_at: result.updated_at
  };
}

export async function deleteCategory(userId: string, categoryId: string) {
  const collection = getCollection<Category>('categories');

  const result = await collection.deleteOne({
    _id: toObjectId(categoryId),
    user_id: toObjectId(userId)
  });

  if (result.deletedCount === 0) {
    throw new Error('Category not found');
  }

  return { success: true };
}

// ==================== BUDGETS ====================

export async function getBudgets(userId: string, selectedMonth?: string) {
  const collection = getCollection<Budget>('budgets');
  const budgets = await collection
    .find({ user_id: toObjectId(userId) })
    .sort({ category: 1 })
    .toArray();

  // Calculate actual spending for selected month
  const { startDate, endDate } = getSalaryCycleDates(selectedMonth);
  const transactionsCollection = getCollection<Transaction>('transactions');

  const transactions = await transactionsCollection
    .find({
      user_id: toObjectId(userId),
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    })
    .toArray();

  // Calculate spending by category
  const spendingByCategory: Record<string, number> = {};
  transactions.forEach(tx => {
    spendingByCategory[tx.category] = (spendingByCategory[tx.category] || 0) + tx.amount;
  });

  return budgets.map(budget => ({
    id: toString(budget._id),
    user_id: toString(budget.user_id),
    category: budget.category,
    monthlyLimit: budget.monthly_limit,
    currentSpent: spendingByCategory[budget.category] || 0,
    created_at: budget.created_at,
    updated_at: budget.updated_at
  }));
}

export async function createBudget(userId: string, budgetData: {
  category: string;
  monthlyLimit: number;
}) {
  const collection = getCollection<Budget>('budgets');

  const newBudget: Omit<Budget, '_id'> = {
    user_id: toObjectId(userId),
    category: budgetData.category,
    monthly_limit: budgetData.monthlyLimit,
    current_spent: 0,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(newBudget as Budget);
  const budget = await collection.findOne({ _id: result.insertedId });

  if (!budget) throw new Error('Failed to create budget');

  return {
    id: toString(budget._id),
    user_id: toString(budget.user_id),
    category: budget.category,
    monthlyLimit: budget.monthly_limit,
    currentSpent: budget.current_spent,
    created_at: budget.created_at,
    updated_at: budget.updated_at
  };
}

export async function updateBudget(userId: string, category: string, monthlyLimit: number) {
  const collection = getCollection<Budget>('budgets');

  // Try to update existing budget
  const result = await collection.findOneAndUpdate(
    { user_id: toObjectId(userId), category },
    { $set: { monthly_limit: monthlyLimit, updated_at: new Date() } },
    { returnDocument: 'after' }
  );

  if (result) {
    return {
      id: toString(result._id),
      user_id: toString(result.user_id),
      category: result.category,
      monthlyLimit: result.monthly_limit,
      currentSpent: result.current_spent,
      created_at: result.created_at,
      updated_at: result.updated_at
    };
  }

  // Budget doesn't exist, create it
  return await createBudget(userId, { category, monthlyLimit });
}

export async function deleteBudget(userId: string, budgetId: string) {
  const collection = getCollection<Budget>('budgets');

  // Get budget to find category
  const budget = await collection.findOne({
    _id: toObjectId(budgetId),
    user_id: toObjectId(userId)
  });

  if (!budget) throw new Error('Budget not found');

  // Delete budget
  await collection.deleteOne({ _id: toObjectId(budgetId) });

  // Delete associated category
  await getCollection('categories').deleteOne({
    user_id: toObjectId(userId),
    name: budget.category
  });

  return { success: true };
}

// ==================== TRANSACTIONS ====================

export async function getTransactions(userId: string, selectedMonth?: string) {
  const collection = getCollection<Transaction>('transactions');

  let query: any = { user_id: toObjectId(userId) };

  if (selectedMonth) {
    const { startDate, endDate } = getSalaryCycleDates(selectedMonth);
    query.date = { $gte: startDate, $lte: endDate };
  }

  const transactions = await collection
    .find(query)
    .sort({ date: -1 })
    .toArray();

  return transactions.map(tx => ({
    id: toString(tx._id),
    user_id: toString(tx.user_id),
    amount: tx.amount,
    description: tx.description,
    category: tx.category,
    type: tx.type,
    date: tx.date,
    created_at: tx.created_at,
    updated_at: tx.updated_at
  }));
}

export async function createTransaction(userId: string, transactionData: {
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'savings';
  date: string | Date;
}) {
  const collection = getCollection<Transaction>('transactions');

  const newTransaction: Omit<Transaction, '_id'> = {
    user_id: toObjectId(userId),
    amount: transactionData.amount,
    description: transactionData.description,
    category: transactionData.category,
    type: transactionData.type,
    date: typeof transactionData.date === 'string' ? new Date(transactionData.date) : transactionData.date,
    created_at: new Date(),
    updated_at: new Date()
  };

  const result = await collection.insertOne(newTransaction as Transaction);
  const transaction = await collection.findOne({ _id: result.insertedId });

  if (!transaction) throw new Error('Failed to create transaction');

  // Generate insights if expense transaction
  if (transaction.type === 'expense') {
    await generateSpendingInsight(userId, transaction);
  }

  return {
    id: toString(transaction._id),
    user_id: toString(transaction.user_id),
    amount: transaction.amount,
    description: transaction.description,
    category: transaction.category,
    type: transaction.type,
    date: transaction.date,
    created_at: transaction.created_at,
    updated_at: transaction.updated_at
  };
}

export async function updateTransaction(userId: string, transactionId: string, transactionData: {
  amount: number;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'savings';
  date: string | Date;
}) {
  const collection = getCollection<Transaction>('transactions');

  const result = await collection.findOneAndUpdate(
    { _id: toObjectId(transactionId), user_id: toObjectId(userId) },
    {
      $set: {
        amount: transactionData.amount,
        description: transactionData.description,
        category: transactionData.category,
        type: transactionData.type,
        date: typeof transactionData.date === 'string' ? new Date(transactionData.date) : transactionData.date,
        updated_at: new Date()
      }
    },
    { returnDocument: 'after' }
  );

  if (!result) throw new Error('Transaction not found');

  return {
    id: toString(result._id),
    user_id: toString(result.user_id),
    amount: result.amount,
    description: result.description,
    category: result.category,
    type: result.type,
    date: result.date,
    created_at: result.created_at,
    updated_at: result.updated_at
  };
}

export async function deleteTransaction(userId: string, transactionId: string) {
  const collection = getCollection<Transaction>('transactions');

  const result = await collection.deleteOne({
    _id: toObjectId(transactionId),
    user_id: toObjectId(userId)
  });

  if (result.deletedCount === 0) {
    throw new Error('Transaction not found');
  }

  return { success: true };
}

// ==================== INSIGHTS ====================

export async function getInsights(userId: string) {
  const collection = getCollection<Insight>('insights');

  const insights = await collection
    .find({ user_id: toObjectId(userId) })
    .sort({ created_at: -1 })
    .toArray();

  return insights.map(insight => ({
    id: toString(insight._id),
    user_id: toString(insight.user_id),
    type: insight.type,
    title: insight.title,
    message: insight.message,
    category: insight.category,
    is_read: insight.is_read,
    created_at: insight.created_at,
    updated_at: insight.updated_at
  }));
}

export async function markInsightAsRead(userId: string, insightId: string) {
  const collection = getCollection<Insight>('insights');

  const result = await collection.findOneAndUpdate(
    { _id: toObjectId(insightId), user_id: toObjectId(userId) },
    { $set: { is_read: true, updated_at: new Date() } },
    { returnDocument: 'after' }
  );

  if (!result) throw new Error('Insight not found');

  return {
    id: toString(result._id),
    is_read: result.is_read
  };
}

// Helper function to generate spending insights
async function generateSpendingInsight(userId: string, transaction: Transaction) {
  const budgetsCollection = getCollection<Budget>('budgets');
  const insightsCollection = getCollection<Insight>('insights');

  // Get budget for this category
  const budget = await budgetsCollection.findOne({
    user_id: toObjectId(userId),
    category: transaction.category
  });

  if (!budget || budget.monthly_limit === 0) return;

  // Calculate current month spending
  const { startDate, endDate } = getSalaryCycleDates();
  const transactionsCollection = getCollection<Transaction>('transactions');

  const transactions = await transactionsCollection
    .find({
      user_id: toObjectId(userId),
      category: transaction.category,
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    })
    .toArray();

  const totalSpent = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const spentPercentage = (totalSpent / budget.monthly_limit) * 100;

  // Generate warning if budget exceeded
  if (spentPercentage > 100) {
    const overAmount = totalSpent - budget.monthly_limit;
    await insightsCollection.insertOne({
      user_id: toObjectId(userId),
      type: 'warning',
      title: 'Budget Exceeded',
      message: `You've exceeded your ${transaction.category} budget by DH${overAmount.toFixed(2)} this month.`,
      category: transaction.category,
      is_read: false,
      created_at: new Date(),
      updated_at: new Date()
    } as Insight);
  }
  // Generate alert if 80% of budget used
  else if (spentPercentage > 80) {
    await insightsCollection.insertOne({
      user_id: toObjectId(userId),
      type: 'warning',
      title: 'Budget Alert',
      message: `You've used ${spentPercentage.toFixed(0)}% of your ${transaction.category} budget this month.`,
      category: transaction.category,
      is_read: false,
      created_at: new Date(),
      updated_at: new Date()
    } as Insight);
  }
}

// ==================== ANALYTICS ====================

export async function getOverviewAnalytics(userId: string, selectedMonth?: string) {
  const { startDate, endDate } = getSalaryCycleDates(selectedMonth);
  const collection = getCollection<Transaction>('transactions');

  const transactions = await collection
    .find({
      user_id: toObjectId(userId),
      date: { $gte: startDate, $lte: endDate }
    })
    .toArray();

  const monthlyIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const monthlySpending = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const savingsAmount = transactions
    .filter(t => t.type === 'savings')
    .reduce((sum, t) => sum + t.amount, 0);

  const currentBalance = monthlyIncome - monthlySpending - savingsAmount;
  const savingsProgress = Math.round(savingsAmount * 100) / 100;

  return {
    currentBalance,
    monthlyIncome,
    monthlySpending,
    savingsProgress
  };
}

export async function getSpendingAnalytics(userId: string, days: number = 7, selectedMonth?: string) {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(endDate.getDate() - (days - 1));

  // If selectedMonth provided, constrain to that month's salary cycle
  if (selectedMonth) {
    const { startDate: cycleStart, endDate: cycleEnd } = getSalaryCycleDates(selectedMonth);
    if (startDate < cycleStart) startDate.setTime(cycleStart.getTime());
    if (endDate > cycleEnd) endDate.setTime(cycleEnd.getTime());
  }

  const collection = getCollection<Transaction>('transactions');
  const transactions = await collection
    .find({
      user_id: toObjectId(userId),
      type: 'expense',
      date: { $gte: startDate, $lte: endDate }
    })
    .sort({ date: 1 })
    .toArray();

  // Initialize all dates with 0
  const spendingByDate: Record<string, number> = {};
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - i);
    const dateKey = date.toISOString().split('T')[0];
    spendingByDate[dateKey] = 0;
  }

  // Sum up spending by date
  transactions.forEach(tx => {
    const dateKey = tx.date.toISOString().split('T')[0];
    if (spendingByDate.hasOwnProperty(dateKey)) {
      spendingByDate[dateKey] += tx.amount;
    }
  });

  return spendingByDate;
}
