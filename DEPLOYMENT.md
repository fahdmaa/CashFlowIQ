# 🚀 CashFlowIQ Deployment Guide

This guide will help you deploy CashFlowIQ to Vercel with PocketBase Cloud as the backend.

## 📋 Prerequisites

- Vercel account
- PocketBase Cloud account (or PocketHost account)
- GitHub repository with your code

## 🗄️ Step 1: Set Up PocketBase Cloud

### Option A: PocketBase Cloud (Recommended)
1. Go to [PocketBase Cloud](https://pocketbase.io/cloud)
2. Create a new account and project
3. Note your instance URL: `https://your-app-name.pocketbase.io`

### Option B: PocketHost (Alternative)
1. Go to [PocketHost](https://pockethost.io)
2. Create a free account
3. Create a new instance
4. Note your instance URL: `https://your-app-name.pockethost.io`

## 🔧 Step 2: Configure PocketBase Collections

1. **Access Admin Panel**: Go to `https://your-app-name.pocketbase.io/_/`
2. **Create Admin Account**: Set up your admin credentials
3. **Create Collections**: You need to create 4 collections with the following specifications:

### Categories Collection
- **Name**: `categories`
- **Type**: `base`
- **Fields**:
  - `user` (relation to users, required, cascade delete)
  - `name` (text, required)
  - `type` (select: income/expense, required)
  - `color` (text, required)
  - `icon` (text, required)
- **API Rules**: `user = @request.auth.id` for all operations

### Budgets Collection
- **Name**: `budgets`
- **Type**: `base`
- **Fields**:
  - `user` (relation to users, required, cascade delete)
  - `category` (text, required)
  - `monthly_limit` (number, required, min: 0)
  - `current_spent` (number, optional, min: 0, default: 0)
- **API Rules**: `user = @request.auth.id` for all operations

### Transactions Collection
- **Name**: `transactions`
- **Type**: `base`
- **Fields**:
  - `user` (relation to users, required, cascade delete)
  - `amount` (number, required, min: 0)
  - `description` (text, required)
  - `category` (text, required)
  - `type` (select: income/expense, required)
  - `date` (date, required)
- **API Rules**: `user = @request.auth.id` for all operations

### Insights Collection
- **Name**: `insights`
- **Type**: `base`
- **Fields**:
  - `user` (relation to users, required, cascade delete)
  - `type` (select: warning/success/info, required)
  - `title` (text, required)
  - `message` (text, required)
  - `category` (text, optional)
  - `is_read` (bool, optional, default: false)
- **API Rules**: `user = @request.auth.id` for all operations

## 👥 Step 3: Create Test Users

1. Go to your PocketBase admin panel
2. Navigate to "Users" collection
3. Create test users:
   - **User 1**: username: `fahdmaa`, email: `fahdmaa@test.com`, password: `fahdmaa123`
   - **User 2**: username: `farahfa`, email: `farahfa@test.com`, password: `farahfa123`

## ⚡ Step 4: Deploy to Vercel

### Via Vercel CLI (Recommended)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? N
# - Project name: cashflowiq
# - Directory: ./
# - Override settings? N
```

### Via Vercel Dashboard
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "New Project"
3. Import from GitHub
4. Select your CashFlowIQ repository
5. Configure build settings:
   - **Framework**: Vite
   - **Build Command**: `npm run vercel-build`
   - **Output Directory**: `dist/public`

## 🔑 Step 5: Configure Environment Variables

In your Vercel project dashboard:

1. Go to **Settings** → **Environment Variables**
2. Add the following variables:

```bash
VITE_POCKETBASE_URL=https://your-app-name.pocketbase.io
POCKETBASE_ADMIN_EMAIL=your-admin@email.com
POCKETBASE_ADMIN_PASSWORD=your-admin-password
NODE_ENV=production
```

## 🧪 Step 6: Test Your Deployment

1. Visit your Vercel deployment URL
2. Try logging in with test credentials:
   - `fahdmaa` / `fahdmaa123`
   - `farahfa` / `farahfa123`
3. Verify that each user sees their own data
4. Test creating transactions, budgets, etc.

## 🛠️ Step 7: Set Up Default Data (Optional)

Run the setup script to populate default categories and budgets:

```bash
# Update the script with your production URL
# Then run locally:
node scripts/setup-user-data.js
```

## 🔒 Security Considerations

1. **Change Default Passwords**: Update all default admin passwords
2. **Enable HTTPS**: Vercel automatically provides HTTPS
3. **Environment Variables**: Never commit `.env` files to git
4. **API Rate Limiting**: PocketBase includes built-in rate limiting
5. **User Authentication**: Users can only access their own data

## 📈 Performance Optimization

1. **CDN**: Vercel's global CDN is automatically enabled
2. **Caching**: Static assets are cached automatically
3. **Edge Functions**: API routes run on Vercel's edge network
4. **Database**: PocketBase Cloud provides optimized performance

## 🐛 Troubleshooting

### Common Issues:

1. **CORS Errors**: Ensure your PocketBase instance allows requests from your domain
2. **Environment Variables**: Double-check all environment variable names and values
3. **Collection Rules**: Verify API rules are set to `user = @request.auth.id`
4. **Build Errors**: Check the Vercel build logs for specific error messages

### Debug Steps:

1. Check Vercel function logs
2. Verify PocketBase admin panel access
3. Test API endpoints directly
4. Validate environment variables in Vercel dashboard

## 🎉 You're Done!

Your CashFlowIQ application should now be:
- ✅ Deployed on Vercel
- ✅ Connected to PocketBase Cloud
- ✅ Fully functional with user authentication
- ✅ Production-ready with proper security

Visit your Vercel URL and start managing your finances! 💰