# Environment Configuration

This project uses a single, centralized environment configuration file.

## Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Choose your database option:**

   ### Option A: Local PostgreSQL (Recommended for Development)
   - Keep the default `DATABASE_URL` in `.env`
   - Run `docker compose up -d` to start the PostgreSQL container
   - Run `cd apps/server && npm run db:migrate` to create tables

   ### Option B: Prisma Accelerate (Cloud Database)
   - Uncomment the Prisma Accelerate `DATABASE_URL` in `.env`
   - Comment out the local PostgreSQL `DATABASE_URL`
   - Update the API key with your own

## Environment Variables

All environment variables are defined in the root `.env` file:

- **Database**: `DATABASE_URL`, `POSTGRES_*`
- **Server**: `NODE_ENV`, `PORT`, `CORS_ORIGIN`
- **Frontend**: `VITE_API_URL`
- **Logging**: `LOG_LEVEL`

## File Structure

- `.env` - Your actual environment variables (not committed to git)
- `.env.example` - Template with all available variables (committed to git)