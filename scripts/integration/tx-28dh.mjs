// Minimal integration script to verify inserting a transaction with currency text works
// Usage:
//   PORT=5000 TOKEN="<your_access_token>" node scripts/integration/tx-28dh.mjs
// The server must be running: npm run dev (uses Supabase routes)

const port = process.env.PORT || 5000;
const token = process.env.TOKEN;
if (!token) {
  console.error('Please set TOKEN env var with a valid Bearer token.');
  process.exit(1);
}

const payload = {
  type: 'expense',
  amount: '28 DH',
  description: 'Divers',
  category: 'Nourriture',
  date: '09/08/2025', // DD/MM/YYYY
};

(async () => {
  const res = await fetch(`http://localhost:${port}/api/transactions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  const text = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', text);
  if (res.status !== 200 && res.status !== 201) {
    throw new Error(`Expected 200/201, got ${res.status}`);
  }
  console.log('OK: Insert succeeded.');
})().catch((e) => {
  console.error('Integration failed:', e);
  process.exit(1);
});

