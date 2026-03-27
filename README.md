# SplitEase — Expense Splitter

A full-stack expense-splitting app built with **NestJS**, **React**, and **PostgreSQL**.

---

## Features

- **Authentication** — email/password registration & login with JWT
- **Groups** — create groups (trips, roommates, etc.) and invite members by email
- **Expenses** — add expenses with description, amount, who paid, and who to split among
- **Flexible splits** — equal, percentage, or exact-amount splits
- **Balances** — see each member's net balance (who owes, who is owed)
- **Optimal settlements** — greedy debt-minimization algorithm that suggests the fewest transactions to settle all debts

---

## Tech Stack

| Layer     | Technology                                      |
|-----------|-------------------------------------------------|
| Backend   | NestJS · TypeORM · PostgreSQL · JWT / Passport  |
| Frontend  | React 18 · TypeScript · Vite · Tailwind CSS     |
| Database  | PostgreSQL 16                                   |
| Container | Docker & Docker Compose                         |

---

## Project Structure

```
.
├── backend/                  # NestJS API
│   ├── src/
│   │   ├── auth/             # JWT auth (register, login)
│   │   ├── users/            # User entity + search
│   │   ├── groups/           # Groups + membership
│   │   ├── expenses/         # Expenses + splits
│   │   └── settlements/      # Balance calculation + optimal settlement
│   └── Dockerfile
├── frontend/                 # React SPA
│   ├── src/
│   │   ├── api/              # Axios API helpers
│   │   ├── contexts/         # AuthContext
│   │   ├── components/       # Navbar, ProtectedRoute
│   │   ├── pages/            # Login, Register, Groups, GroupDetail, AddExpense
│   │   └── types/            # Shared TypeScript types
│   └── Dockerfile
└── docker-compose.yml
```

---

## Quick Start (Docker)

```bash
# Clone and start everything
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api

---

## Local Development

### Prerequisites
- Node.js 20+
- PostgreSQL 16 running locally (or use Docker for just the DB)

### 1. Start PostgreSQL

```bash
docker compose up -d postgres
```

### 2. Backend

```bash
cd backend
cp .env.example .env          # edit DB credentials and JWT secret if needed
npm install
npm run start:dev             # http://localhost:3000
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev                   # http://localhost:5173
```

The Vite dev server proxies `/api/*` to `http://localhost:3000` automatically.

---

## API Reference

### Auth
| Method | Path                  | Body                              | Auth |
|--------|-----------------------|-----------------------------------|------|
| POST   | `/api/auth/register`  | `{name, email, password}`         | —    |
| POST   | `/api/auth/login`     | `{email, password}`               | —    |

### Users
| Method | Path                     | Notes                         | Auth |
|--------|--------------------------|-------------------------------|------|
| GET    | `/api/users/me`          | Current user profile          | ✅   |
| GET    | `/api/users/search?email`| Search users by email         | ✅   |

### Groups
| Method | Path                          | Body / Notes                       | Auth |
|--------|-------------------------------|------------------------------------|------|
| GET    | `/api/groups`                 | All groups for current user        | ✅   |
| POST   | `/api/groups`                 | `{name, description?}`             | ✅   |
| GET    | `/api/groups/:id`             | Group + members                    | ✅   |
| POST   | `/api/groups/:id/members`     | `{email}` — add member by email    | ✅   |

### Expenses
| Method | Path                          | Body / Notes                       | Auth |
|--------|-------------------------------|------------------------------------|------|
| GET    | `/api/expenses/group/:groupId`| All expenses for a group           | ✅   |
| POST   | `/api/expenses`               | See below                          | ✅   |
| DELETE | `/api/expenses/:id`           | Delete expense (group member only) | ✅   |

**Create expense body:**
```json
{
  "groupId": "uuid",
  "description": "Dinner",
  "amount": 1200,
  "paidById": "uuid",
  "splitType": "equal" | "percentage" | "exact",
  "splits": [
    { "userId": "uuid" },                          // equal
    { "userId": "uuid", "percentage": 40 },        // percentage
    { "userId": "uuid", "amount": 480 }            // exact
  ]
}
```

### Settlements
| Method | Path                              | Notes                             | Auth |
|--------|-----------------------------------|-----------------------------------|------|
| GET    | `/api/settlements/group/:groupId` | Balances + optimal settlement plan| ✅   |

---

## Settlement Algorithm

The settlement module uses a **greedy debt-minimization** algorithm:

1. Compute each member's **net balance** = Σ(amounts paid by them) − Σ(their split amounts)
2. Separate members into **creditors** (positive balance) and **debtors** (negative balance)
3. Sort both lists by absolute amount descending
4. Greedily pair the largest debtor with the largest creditor:
   - Assign `min(debt, credit)` as the transaction amount
   - Reduce both accordingly
5. Repeat until all debts are zero

This produces the **minimum number of transactions** needed to settle all debts.
