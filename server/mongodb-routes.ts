import express, { Request, Response } from 'express';
import { authenticateToken, getUserId } from './auth-middleware';
import { loginUser, registerUser, refreshAccessToken, getUserById } from './auth-service';
import * as storage from './mongodb-storage';

const router = express.Router();

// ==================== AUTHENTICATION ROUTES (PUBLIC) ====================

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Register user
    const user = await registerUser(email, password, username);

    // Auto-login after registration
    const { tokens } = await loginUser(email, password);

    // Return user info without password
    const { password_hash, ...userWithoutPassword } = user;

    res.status(201).json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      ...tokens
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(400).json({ error: error.message || 'Registration failed' });
  }
});

/**
 * POST /api/auth/login
 * Login user with email/username and password
 */
router.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { user, tokens } = await loginUser(email, password);

    // Return user info without password
    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        username: user.username,
        profile_picture_url: user.profile_picture_url,
        created_at: user.created_at,
        updated_at: user.updated_at
      },
      ...tokens
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(401).json({ error: error.message || 'Invalid credentials' });
  }
});

/**
 * POST /api/auth/refresh
 * Refresh access token using refresh token
 */
router.post('/auth/refresh', async (req: Request, res: Response) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const tokens = await refreshAccessToken(refreshToken);
    res.json(tokens);
  } catch (error: any) {
    console.error('Token refresh error:', error);
    res.status(401).json({ error: error.message || 'Invalid refresh token' });
  }
});

/**
 * GET /api/auth/me
 * Get current user info
 */
router.get('/auth/me', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Return user info without password
    res.json({
      id: user._id.toString(),
      email: user.email,
      username: user.username,
      profile_picture_url: user.profile_picture_url,
      created_at: user.created_at,
      updated_at: user.updated_at
    });
  } catch (error: any) {
    console.error('Get user error:', error);
    res.status(500).json({ error: error.message || 'Failed to get user info' });
  }
});

// ==================== CATEGORIES ROUTES (PROTECTED) ====================

/**
 * GET /api/categories
 * Get all categories for the authenticated user
 */
router.get('/categories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const categories = await storage.getCategories(userId);
    res.json(categories);
  } catch (error: any) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch categories' });
  }
});

/**
 * POST /api/categories
 * Create a new category
 */
router.post('/categories', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { name, type, color, icon } = req.body;

    if (!name || !type || !color || !icon) {
      return res.status(400).json({ error: 'Name, type, color, and icon are required' });
    }

    const category = await storage.createCategory(userId, { name, type, color, icon });
    res.status(201).json(category);
  } catch (error: any) {
    console.error('Create category error:', error);
    res.status(400).json({ error: error.message || 'Failed to create category' });
  }
});

/**
 * PUT /api/categories/:id
 * Update category name
 */
router.put('/categories/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const category = await storage.updateCategory(userId, id, name);
    res.json(category);
  } catch (error: any) {
    console.error('Update category error:', error);
    res.status(400).json({ error: error.message || 'Failed to update category' });
  }
});

/**
 * DELETE /api/categories/:id
 * Delete a category
 */
router.delete('/categories/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    await storage.deleteCategory(userId, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete category error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete category' });
  }
});

// ==================== BUDGETS ROUTES (PROTECTED) ====================

/**
 * GET /api/budgets
 * Get all budgets with calculated spending for selected month
 */
router.get('/budgets', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const selectedMonth = req.query.month as string | undefined;

    const budgets = await storage.getBudgets(userId, selectedMonth);
    res.json(budgets);
  } catch (error: any) {
    console.error('Get budgets error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch budgets' });
  }
});

/**
 * POST /api/budgets
 * Create a new budget
 */
router.post('/budgets', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { category, monthlyLimit } = req.body;

    if (!category || monthlyLimit === undefined) {
      return res.status(400).json({ error: 'Category and monthlyLimit are required' });
    }

    const budget = await storage.createBudget(userId, { category, monthlyLimit });
    res.status(201).json(budget);
  } catch (error: any) {
    console.error('Create budget error:', error);
    res.status(400).json({ error: error.message || 'Failed to create budget' });
  }
});

/**
 * PUT /api/budgets/:category
 * Update budget limit for a category
 */
router.put('/budgets/:category', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { category } = req.params;
    const { monthlyLimit } = req.body;

    if (monthlyLimit === undefined) {
      return res.status(400).json({ error: 'monthlyLimit is required' });
    }

    const budget = await storage.updateBudget(userId, decodeURIComponent(category), monthlyLimit);
    res.json(budget);
  } catch (error: any) {
    console.error('Update budget error:', error);
    res.status(400).json({ error: error.message || 'Failed to update budget' });
  }
});

/**
 * DELETE /api/budgets/:id
 * Delete a budget and its associated category
 */
router.delete('/budgets/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    await storage.deleteBudget(userId, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete budget error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete budget' });
  }
});

// ==================== TRANSACTIONS ROUTES (PROTECTED) ====================

/**
 * GET /api/transactions
 * Get all transactions, optionally filtered by month
 */
router.get('/transactions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const selectedMonth = req.query.month as string | undefined;

    const transactions = await storage.getTransactions(userId, selectedMonth);
    res.json(transactions);
  } catch (error: any) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch transactions' });
  }
});

/**
 * POST /api/transactions
 * Create a new transaction
 */
router.post('/transactions', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { amount, description, category, type, date } = req.body;

    if (!amount || !description || !category || !type || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const transaction = await storage.createTransaction(userId, {
      amount: parseFloat(amount),
      description,
      category,
      type,
      date
    });

    res.status(201).json(transaction);
  } catch (error: any) {
    console.error('Create transaction error:', error);
    res.status(400).json({ error: error.message || 'Failed to create transaction' });
  }
});

/**
 * PUT /api/transactions/:id
 * Update a transaction
 */
router.put('/transactions/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;
    const { amount, description, category, type, date } = req.body;

    if (!amount || !description || !category || !type || !date) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const transaction = await storage.updateTransaction(userId, id, {
      amount: parseFloat(amount),
      description,
      category,
      type,
      date
    });

    res.json(transaction);
  } catch (error: any) {
    console.error('Update transaction error:', error);
    res.status(400).json({ error: error.message || 'Failed to update transaction' });
  }
});

/**
 * DELETE /api/transactions/:id
 * Delete a transaction
 */
router.delete('/transactions/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    await storage.deleteTransaction(userId, id);
    res.json({ success: true });
  } catch (error: any) {
    console.error('Delete transaction error:', error);
    res.status(400).json({ error: error.message || 'Failed to delete transaction' });
  }
});

// ==================== INSIGHTS ROUTES (PROTECTED) ====================

/**
 * GET /api/insights
 * Get all insights for the authenticated user
 */
router.get('/insights', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const insights = await storage.getInsights(userId);
    res.json(insights);
  } catch (error: any) {
    console.error('Get insights error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch insights' });
  }
});

/**
 * PUT /api/insights/:id/read
 * Mark an insight as read
 */
router.put('/insights/:id/read', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    const insight = await storage.markInsightAsRead(userId, id);
    res.json(insight);
  } catch (error: any) {
    console.error('Mark insight as read error:', error);
    res.status(400).json({ error: error.message || 'Failed to mark insight as read' });
  }
});

// ==================== ANALYTICS ROUTES (PROTECTED) ====================

/**
 * GET /api/analytics/overview
 * Get financial overview (balance, income, spending, savings)
 */
router.get('/analytics/overview', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const selectedMonth = req.query.month as string | undefined;

    const analytics = await storage.getOverviewAnalytics(userId, selectedMonth);
    res.json(analytics);
  } catch (error: any) {
    console.error('Get overview analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});

/**
 * GET /api/analytics/spending
 * Get spending analytics for chart
 */
router.get('/analytics/spending', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = getUserId(req);
    const days = parseInt(req.query.days as string) || 7;
    const selectedMonth = req.query.month as string | undefined;

    const analytics = await storage.getSpendingAnalytics(userId, days, selectedMonth);
    res.json(analytics);
  } catch (error: any) {
    console.error('Get spending analytics error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch spending analytics' });
  }
});

// ==================== HEALTH CHECK ====================

/**
 * GET /api/health
 * Health check endpoint
 */
router.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    database: 'mongodb',
    timestamp: new Date().toISOString()
  });
});

export default router;
