# Finco AI - Intelligent Financial Assistant

Finco AI is a modern, conversational financial management application designed to simplify bookkeeping through AI. It allows users to manage their personal or business finances using natural language, automatically transforming chat messages into structured double-entry accounting records.

## 🚀 Features

- **Conversational Accounting**: Register expenses, income, and transfers just by talking to the AI.
- **Fault-Tolerant Account Creation**: If the AI detects a new category (e.g., "Medical Exams"), it automatically creates the corresponding accounting account following professional standards.
- **Double-Entry System**: Built on a solid ledger-based architecture (Assets, Liabilities, Equity, Income, Expenses).
- **Dynamic Chart of Accounts**: Real-time hierarchical visualization of your financial structure with automatic balance roll-ups.
- **Real-time Dashboard**: Visual insights into income vs. expenses, distribution by category, and net balance.
- **Intelligent Memory**: The assistant remembers your preferences and previous financial decisions to provide a personalized experience.

## 🛠️ Tech Stack

- **Frontend**: [Next.js 16](https://nextjs.org/) (App Router), [React 19](https://react.dev/), [Tailwind CSS v4](https://tailwindcss.com/)
- **Backend**: Next.js Route Handlers, [Server Components](https://nextjs.org/docs/app/building-your-application/rendering/server-components)
- **Database & ORM**: [PostgreSQL](https://www.postgresql.org/), [Prisma ORM](https://www.prisma.io/)
- **AI Engine**: [OpenAI GPT-4o-mini](https://openai.com/) via [Vercel AI SDK](https://sdk.vercel.ai/)
- **Authentication**: [Better Auth](https://better-auth.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/)
- **Icons**: [Lucide React](https://lucide.dev/)

## 📋 Prerequisites

- Node.js 20+
- PostgreSQL instance
- OpenAI API Key

## ⚙️ Setup Instructions

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd finco_ai_app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Environment Variables**:
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/finco_db?schema=public"
   OPENAI_API_KEY="your_openai_api_key"
   BETTER_AUTH_SECRET="your_auth_secret"
   BETTER_AUTH_URL="http://localhost:3000"
   ```

4. **Database Setup**:
   ```bash
   npx prisma generate
   npx prisma migrate dev --name init
   npm run seed # Optional: To populate basic Chart of Accounts
   ```

5. **Run the development server**:
   ```bash
   npm run dev
   ```

## 🏗️ Project Structure

- `app/`: Next.js pages, API routes, and layouts.
- `components/`: Reusable UI components (Dashboard, Chat, Charts).
- `lib/`: Core logic, AI configurations, Prisma client, and helper functions.
- `prisma/`: Database schema and migration files.
- `constants/`: System prompts and application constants.

## 👤 Author

Developed by **Victor Zuluaga** ([@zrvictor00](https://github.com/zrvictor00)).

---
*Finco AI - Making accounting as simple as a text message.*
