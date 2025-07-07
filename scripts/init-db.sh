#!/bin/bash
set -e

echo "🔄 Starting database initialization..."

echo "🔍 DATABASE_URL = $DATABASE_URL"

if [ -z "$DATABASE_URL" ]; then
  echo "❌ DATABASE_URL is not set"
  exit 1
fi

# Run the Prisma migration
npx prisma migrate deploy --schema=./src/prisma/schema.prisma
# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U secret_santa_user; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Change to the server directory
cd /usr/src/app/apps/server

# Run database migrations
echo "🔄 Running database migrations..."
npm run db:migrate:deploy

echo "✅ Database initialization complete!"

# Start the application
echo "🚀 Starting the application..."
exec "$@"
