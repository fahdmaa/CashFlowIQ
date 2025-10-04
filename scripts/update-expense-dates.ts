import "dotenv/config";
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateExpenseDates() {
  console.log('Fetching expense transactions for this month...');

  // Get all expense transactions for October 2025
  const { data: expenses, error: fetchError } = await supabase
    .from('transactions')
    .select('*')
    .eq('type', 'expense')
    .gte('date', '2025-10-01')
    .lte('date', '2025-10-31')
    .order('created_at', { ascending: true });

  if (fetchError) {
    console.error('Error fetching expenses:', fetchError);
    return;
  }

  if (!expenses || expenses.length === 0) {
    console.log('No expense transactions found for October 2025');
    return;
  }

  console.log(`Found ${expenses.length} expense transactions`);

  // Calculate date distribution
  const startDate = new Date('2025-10-01');
  const endDate = new Date(); // Today
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

  console.log(`Distributing expenses from Oct 1 to ${endDate.toISOString().split('T')[0]} (${daysDiff + 1} days)`);

  // Distribute expenses evenly
  const updates = expenses.map((expense, index) => {
    const dayOffset = Math.floor((index / expenses.length) * (daysDiff + 1));
    const newDate = new Date(startDate);
    newDate.setDate(startDate.getDate() + dayOffset);
    const newDateStr = newDate.toISOString().split('T')[0];

    return {
      id: expense.id,
      oldDate: expense.date,
      newDate: newDateStr
    };
  });

  console.log('\nUpdating dates:');

  for (const update of updates) {
    console.log(`Transaction ${update.id}: ${update.oldDate} -> ${update.newDate}`);

    const { error: updateError } = await supabase
      .from('transactions')
      .update({ date: update.newDate })
      .eq('id', update.id);

    if (updateError) {
      console.error(`Error updating transaction ${update.id}:`, updateError);
    }
  }

  console.log('\nDone! All expense dates updated.');
}

updateExpenseDates().catch(console.error);
