/**
 * Utility functions for exporting data to various formats
 */

interface Transaction {
  id: string;
  date: string;
  description: string;
  category: string;
  type: 'income' | 'expense' | 'savings';
  amount: string;
}

/**
 * Convert transactions array to CSV format
 */
export function transactionsToCSV(transactions: Transaction[]): string {
  // Define CSV headers
  const headers = ['Date', 'Description', 'Category', 'Type', 'Amount'];
  
  // Create CSV rows
  const rows = transactions.map(transaction => {
    const date = new Date(transaction.date).toLocaleDateString('en-US');
    const amount = parseFloat(transaction.amount).toFixed(2);
    
    // Escape values that might contain commas or quotes
    const escapeCSV = (value: string): string => {
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    };
    
    return [
      date,
      escapeCSV(transaction.description),
      escapeCSV(transaction.category),
      transaction.type,
      transaction.type === 'income' ? amount : `-${amount}`
    ].join(',');
  });
  
  // Combine headers and rows
  return [headers.join(','), ...rows].join('\n');
}

/**
 * Download CSV file to user's computer
 */
export function downloadCSV(csvContent: string, filename: string): void {
  // Create a Blob from the CSV content
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Create a temporary URL for the blob
  const url = URL.createObjectURL(blob);
  
  // Create a temporary anchor element and trigger download
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL
  URL.revokeObjectURL(url);
}

/**
 * Generate filename with current date
 */
export function generateCSVFilename(prefix: string = 'transactions'): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  
  return `${prefix}_${year}-${month}-${day}.csv`;
}