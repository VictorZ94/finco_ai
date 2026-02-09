# Project Overview
**finco_ai_app** is a financial assistant application built with Next.js 16. It appears to be designed to help users manage accounts, transactions, and ledgers, potentially through a conversational interface (inferred from the `Messages` and `Role` models).

## Tech Stack
- **Framework**: Next.js 16.1.1 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Database**: PostgreSQL
- **ORM**: Prisma (client generated at `generated/prisma`)
- **Package Manager**: npm (inferred from `package-lock.json`)

## Architecture
- **Frontend**: React 19 components located in `app/`.
- **Backend**: Next.js Route Handlers in `app/api/`.
- **Data Access**: Prisma Client singleton instance exported from `app/lib/prisma.ts`.
- **Database Schema**: Defined in `prisma/schema.prisma`. It includes models for `User`, `Messages` (chat), `Accounts`, `Transactions`, and `LedgerEntries` (double-entry bookkeeping).

# Building and Running

## Prerequisites
- Node.js
- PostgreSQL database

## Environment Setup
Ensure a `.env` file exists with the necessary environment variables, particularly:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
```

## Available Scripts
- **Start Development Server**:
  ```bash
  npm run dev
  ```
- **Build for Production**:
  ```bash
  npm run build
  ```
- **Start Production Server**:
  ```bash
  npm run start
  ```
- **Lint Code**:
  ```bash
  npm run lint
  ```

## Database Management
- **Generate Prisma Client**:
  ```bash
  npx prisma generate
  ```
  *Note: The client is generated to `../generated/prisma` as specified in `schema.prisma`.*

- **Run Migrations**:
  ```bash
  npx prisma migrate dev
  ```

# Development Conventions
- **Path Aliases**: The `@/` alias is configured in `tsconfig.json` to point to the project root (`./`).
- **Prisma Client**: Always import the Prisma client instance from `@/app/lib/prisma` rather than instantiating a new one, to prevent connection exhaustion in development.
- **Styling**: Uses Tailwind CSS. Global styles are in `app/globals.css`.
- **Data Model**: The application implements a double-entry accounting system (`LedgerEntries` linked to `Transactions` and `Accounts`) and a chat system (`Messages` linked to `User`).

# Key Directories
- `app/`: Source code for pages, components, and API routes.
- `prisma/`: Database schema and migrations.
- `generated/`: Contains the generated Prisma client.
- `public/`: Static assets.
