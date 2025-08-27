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
      // Get categories
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        console.error('Error fetching categories:', error);
        return res.status(500).json({ message: "Failed to fetch categories" });
      }

      return res.json(data || []);
    }

    if (req.method === 'POST') {
      // Create category
      const { name, type, color, icon } = req.body;

      const { data, error } = await supabase
        .from('categories')
        .insert([{
          user_id: userId,
          name,
          type,
          color,
          icon
        }])
        .select()
        .single();

      if (error) {
        console.error('Error creating category:', error);
        return res.status(500).json({ message: "Failed to create category" });
      }

      return res.json(data);
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Categories API error:', error);
    return res.status(500).json({ message: "Server error" });
  }
}