// Test script to verify budget deletion functionality
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Service role key to bypass RLS

console.log('Testing budget deletion...');
console.log('Supabase URL:', supabaseUrl);

if (!supabaseUrl) {
  console.error('VITE_SUPABASE_URL not found in environment');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey || process.env.VITE_SUPABASE_ANON_KEY);

async function testBudgetDeletion() {
  try {
    // First, let's see what budgets exist
    console.log('\n1. Fetching all budgets...');
    const { data: budgets, error: fetchError } = await supabase
      .from('budgets')
      .select('*');
    
    if (fetchError) {
      console.error('Error fetching budgets:', fetchError);
      return;
    }
    
    console.log('Found budgets:', budgets);
    
    if (!budgets || budgets.length === 0) {
      console.log('No budgets found to test deletion');
      return;
    }
    
    // Try to delete the first budget
    const testBudget = budgets[0];
    console.log(`\n2. Attempting to delete budget: ${testBudget.id} (${testBudget.category})`);
    
    const { data: deleteResult, error: deleteError } = await supabase
      .from('budgets')
      .delete()
      .eq('id', testBudget.id)
      .select();
    
    console.log('Delete result:', { data: deleteResult, error: deleteError });
    
    if (deleteError) {
      console.error('Delete failed:', deleteError);
    } else if (!deleteResult || deleteResult.length === 0) {
      console.warn('No rows were deleted - this might be an RLS policy issue');
    } else {
      console.log('✅ Delete successful!');
    }
    
    // Check what's left
    console.log('\n3. Checking remaining budgets...');
    const { data: remainingBudgets } = await supabase
      .from('budgets')
      .select('*');
    
    console.log('Remaining budgets:', remainingBudgets);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testBudgetDeletion();