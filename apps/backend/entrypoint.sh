#!/bin/sh
set -e

echo "🔍 Checking dependencies..."

# Check if root node_modules exists
if [ ! -d "/app/node_modules" ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
    echo "📦 Root node_modules not found or empty. Installing dependencies..."
    cd /app
    yarn install --frozen-lockfile
    cd /app/apps/backend
fi

# Check if backend node_modules exists (if using a separate volume)
if [ ! -d "/app/apps/backend/node_modules" ] || [ -z "$(ls -A /app/apps/backend/node_modules 2>/dev/null)" ]; then
    echo "📦 Backend node_modules not found or empty. Installing dependencies..."
    cd /app
    yarn install --frozen-lockfile
    cd /app/apps/backend
fi

# Check Prisma client
if [ ! -d "/app/node_modules/.prisma" ]; then
    echo "🔄 Generating Prisma client..."
    yarn prisma generate
fi

# Run migrations
echo "🗃️ Running database migrations..."
yarn prisma migrate deploy

echo "🚀 Starting application..."
exec "$@"
