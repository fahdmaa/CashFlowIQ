# 💰 CashFlowIQ

A modern personal finance management application built with React, TypeScript, and PocketBase.

## 🌟 Features

- **Multi-User Support**: Each user has their own isolated financial data
- **Real-time Dashboard**: Interactive charts and financial overview
- **Transaction Management**: Add, view, and categorize income/expenses
- **Budget Tracking**: Set monthly budgets and track spending
- **Smart Insights**: AI-powered spending alerts and recommendations
- **Responsive Design**: Works perfectly on desktop and mobile
- **Secure Authentication**: JWT-based authentication with PocketBase

## 🚀 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Radix UI** for accessible components
- **Recharts** for data visualization
- **Wouter** for routing
- **TanStack Query** for data fetching

### Backend
- **PocketBase** for database and authentication
- **Express.js** for API routes (Vercel serverless functions)
- **Zod** for data validation

### Infrastructure
- **Vercel** for hosting and deployment
- **PocketBase Cloud** for database hosting

## 🏗️ Development Setup

### Prerequisites
- Node.js 18+
- npm or yarn

### Local Development

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd CashFlowIQ
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up PocketBase locally**
   ```bash
   # Start PocketBase (in a separate terminal)
   cd pocketbase
   ./pocketbase serve --http="127.0.0.1:8090"
   ```

4. **Configure environment variables**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your values
   ```

5. **Set up PocketBase collections**
   - Go to `http://127.0.0.1:8090/_/`
   - Create admin account
   - Create required collections (see DEPLOYMENT.md)

6. **Create test users and data**
   ```bash
   node scripts/create-users.js
   node scripts/setup-user-data.js
   ```

7. **Start development server**
   ```bash
   npm run dev
   ```

8. **Access the application**
   - Frontend: `http://localhost:5000`
   - PocketBase Admin: `http://localhost:8090/_/`

### Test Accounts
- **User 1**: `fahdmaa` / `fahdmaa123`
- **User 2**: `farahfa` / `farahfa123`

## 🚀 Production Deployment

### Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/CashFlowIQ)

### Manual Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed deployment instructions including:
- Setting up PocketBase Cloud
- Configuring Vercel
- Environment variables
- Production setup

## 📊 Database Schema

### Collections Structure
- **Users**: Authentication and user management
- **Categories**: Income/expense categories with colors and icons
- **Budgets**: Monthly budget limits and current spending
- **Transactions**: Financial transactions with categorization
- **Insights**: Smart notifications and spending alerts

### User Data Isolation
Each user's data is completely isolated using PocketBase's built-in access rules:
```javascript
// Example rule for transactions
user = @request.auth.id
```

## 🛡️ Security

- **Authentication**: JWT tokens with PocketBase
- **Authorization**: User-specific data access rules
- **Data Validation**: Zod schemas for all inputs
- **CORS**: Properly configured for production
- **Environment Variables**: Secure configuration management

## 📱 Features Overview

### Dashboard
- Real-time financial overview
- Monthly income/expense summary
- Budget progress indicators
- Recent transactions
- Smart insights

### Transactions
- Add income/expense transactions
- Category management
- Date filtering
- Transaction history

### Budgets
- Set monthly budget limits
- Track spending by category
- Budget vs actual spending
- Visual progress indicators

### Insights
- Overspending alerts
- Budget warnings
- Spending pattern analysis
- Personalized recommendations

## 🔧 Scripts

```bash
# Development
npm run dev                 # Start development server
npm run build              # Build for production
npm run build:client       # Build client only
npm run build:server       # Build server only

# PocketBase Setup
node scripts/create-users.js        # Create test users
node scripts/setup-user-data.js     # Add default categories/budgets
node scripts/setup-production.js    # Production setup script

# Deployment
npm run vercel-build       # Vercel build command
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🙏 Acknowledgments

- [PocketBase](https://pocketbase.io) for the excellent backend solution
- [Radix UI](https://radix-ui.com) for accessible components
- [Tailwind CSS](https://tailwindcss.com) for the styling system
- [Vercel](https://vercel.com) for seamless deployment

---

Built with ❤️ by the CashFlowIQ team