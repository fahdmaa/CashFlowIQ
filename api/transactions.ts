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
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Require authentication
  const userId = await requireAuth(req);
  if (!userId) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    if (req.method === 'GET') {
      // Get transactions
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching transactions:', error);
        return res.status(500).json({ message: "Failed to fetch transactions" });
      }

      return res.json(data || []);
    }

    if (req.method === 'POST') {
      // Create transaction
      const { amount, description, category, type, date } = req.body as any;
      // Normalize amount and date on serverless path too
      const normalizeAmount = (input: any): string => {
        if (typeof input === 'number') return Number.isFinite(input) ? String(input) : '';
        let s = (input ?? '').toString().trim().toLowerCase();
        if (s.includes(',') && !s.includes('.')) s = s.replace(/,/g, '.');
        else s = s.replace(/,/g, '');
        s = s.replace(/[^0-9.\-]/g, '');
        s = s.replace(/(?!^)-/g, '');
        const firstDot = s.indexOf('.');
        if (firstDot !== -1) s = s.slice(0, firstDot + 1) + s.slice(firstDot + 1).replace(/\./g, '');
        const val = parseFloat(s);
        return Number.isFinite(val) ? s : '';
      };
      const normalizeDateToISO = (input: string): string => {
        if (/^\d{4}-\d{2}-\d{2}/.test(input)) {
          const [y, m, d] = input.split('-').map(Number);
          return new Date(Date.UTC(y, (m || 1) - 1, d || 1)).toISOString();
        }
        const m = input.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (m) {
          const [, dd, mm, yyyy] = m;
          const y = parseInt(yyyy, 10);
          const mon = parseInt(mm, 10);
          const day = parseInt(dd, 10);
          const dt = new Date(Date.UTC(y, mon - 1, day));
          return dt.toISOString();
        }
        return new Date(input).toISOString();
      };

      const amountStr = normalizeAmount(amount);
      if (!amountStr) {
        return res.status(400).json({ message: 'Amount must be a valid number (e.g., 28 or 28.00).' });
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: userId,
          amount: parseFloat(amountStr),
          description,
          category,
          type,
          date: normalizeDateToISO(date)
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating transaction:', error);
        return res.status(500).json({ message: "Failed to create transaction" });
      }

      return res.json(data);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Transactions API error:', error);
    return res.status(500).json({ message: "Server error" });
  }
}
