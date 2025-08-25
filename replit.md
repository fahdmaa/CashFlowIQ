# Overview

BudgetWise is a comprehensive personal finance management application built with React and Express. The application helps users track their expenses, manage budgets, and gain insights into their spending patterns through smart analytics and automated categorization. It features a modern, responsive interface with real-time data visualization and intelligent financial recommendations.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The client uses React with TypeScript in a Vite-powered single-page application. The UI is built with shadcn/ui components and Tailwind CSS for styling, providing a modern and responsive design system. The application follows a component-based architecture with:

- **State Management**: TanStack Query for server state management and caching
- **Routing**: Wouter for lightweight client-side routing
- **Forms**: React Hook Form with Zod validation for type-safe form handling
- **UI Components**: Radix UI primitives with custom styling via shadcn/ui
- **Charts**: Recharts for data visualization and spending analytics

## Backend Architecture
The server uses Express.js with TypeScript in an ESM module setup. It follows a RESTful API design pattern with:

- **Database Layer**: Drizzle ORM for type-safe database operations with PostgreSQL
- **Storage Pattern**: Abstracted storage interface allowing for multiple implementations (currently in-memory for development)
- **Route Organization**: Centralized route registration with proper error handling middleware
- **Data Validation**: Zod schemas shared between client and server for consistent validation

## Data Storage
The application uses PostgreSQL as the primary database with Drizzle ORM providing:

- **Schema Definition**: Type-safe schema definitions with automatic TypeScript inference
- **Migrations**: Database schema versioning through Drizzle Kit
- **Connection**: Neon Database serverless PostgreSQL for cloud deployment
- **Session Storage**: PostgreSQL-based session storage for user sessions

The data model includes three main entities:
- **Transactions**: Financial transactions with automatic categorization
- **Budgets**: Monthly spending limits per category with progress tracking
- **Insights**: AI-generated financial recommendations and alerts

## Authentication and Authorization
Currently implements a basic session-based approach with:

- **Session Management**: Express sessions with PostgreSQL storage
- **Middleware**: Custom middleware for request logging and error handling
- **Security**: CORS configuration and input validation at API boundaries

## Key Features

### Smart Transaction Categorization
Automatic categorization of transactions using keyword-based algorithms that analyze transaction descriptions to assign appropriate spending categories.

### Budget Tracking
Real-time budget monitoring with visual progress indicators, overspending alerts, and category-based spending limits.

### Financial Insights
Intelligent analysis of spending patterns with automated generation of actionable insights, warnings for budget overruns, and spending trend recommendations.

### Analytics Dashboard
Interactive spending analytics with customizable time periods, visual charts, and financial overview cards showing current balance, income, expenses, and savings rate.

# External Dependencies

## Database Services
- **Neon Database**: Serverless PostgreSQL database hosting
- **Drizzle ORM**: Type-safe database toolkit and query builder
- **connect-pg-simple**: PostgreSQL session store for Express

## UI and Styling
- **Radix UI**: Headless UI primitives for accessible components
- **Tailwind CSS**: Utility-first CSS framework for styling
- **Lucide React**: Icon library for consistent iconography
- **Recharts**: Composable charting library for data visualization

## Development Tools
- **Vite**: Fast build tool and development server
- **TypeScript**: Static type checking and enhanced developer experience
- **TanStack Query**: Server state management and data fetching
- **React Hook Form**: Performant form library with validation
- **Zod**: TypeScript-first schema validation

## Deployment and Hosting
- **Replit**: Development and hosting platform with integrated environment
- **ESBuild**: Fast JavaScript bundler for production builds
- **PostCSS**: CSS processing for Tailwind and autoprefixing