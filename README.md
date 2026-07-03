# MuradERP

Proprietary Enterprise Resource Planning (ERP) system — original codebase.

## Stack

- **Backend**: Node.js, Express, TypeScript, Prisma ORM
- **Database**: PostgreSQL (via Prisma)
- **Auth**: JWT (access + refresh tokens)

## Structure

```
backend/
  prisma/schema.prisma   # Database schema
  src/
    controllers/         # Route handlers
    routes/               # Express route definitions
    middleware/           # Auth, error handling, rate limiting, logging
    utils/                # JWT, password hashing, Prisma client, logger
    server.ts             # App entry point
```

## Getting started

```bash
cd backend
npm install
cp .env.example .env      # fill in DATABASE_URL, JWT_SECRET, etc.
npx prisma generate
npx prisma migrate dev
npm run dev
```

## License

Proprietary — All rights reserved.
