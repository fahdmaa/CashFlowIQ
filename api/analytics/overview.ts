import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function requireAuth(req: VercelRequest): Promise<string | null> {
  const authHeader = req.headers.authorization as string;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.substring(7);
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return null;
    }
    
    return user.id;
  } catch (error) {
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  // Require authentication
  const userId = await requireAuth(req);
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const currentMonth = new Date();
    const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    // Get monthly transactions
    const { data: transactions, error } = await supabase
      .from('transactions')
      .select('amount, type')
      .eq('user_id', userId)
      .gte('date', startOfMonth.toISOString())
      .lte('date', endOfMonth.toISOString());

    if (error) {
      console.error('Error fetching overview analytics:', error);
      return res.status(500).json({ message: "Failed to fetch overview analytics" });
    }

    const monthlyIncome = (transactions || [])
      .filter(t => t.type === "income")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);
      
    const monthlySpending = (transactions || [])
      .filter(t => t.type === "expense")
      .reduce((sum, t) => sum + parseFloat(t.amount.toString()), 0);

    const currentBalance = monthlyIncome - monthlySpending;
    
    // Calculate savings goal progress (assuming goal is to save 20% of income)
    const savingsGoal = monthlyIncome * 0.2;
    const actualSavings = monthlyIncome - monthlySpending;
    const savingsProgress = savingsGoal > 0 ? Math.min((actualSavings / savingsGoal) * 100, 100) : 0;

    return res.json({
      currentBalance,
      monthlyIncome,
      monthlySpending,
      savingsProgress: Math.round(savingsProgress)
    });
  } catch (error) {
    console.error('Overview analytics API error:', error);
    return res.status(500).json({ message: "Server error" });
  }
}