#!/bin/sh
set -e

echo "🔍 Checking dependencies..."

# Check if root node_modules exists
if [ ! -d "/app/node_modules" ] || [ -z "$(ls -A /app/node_modules 2>/dev/null)" ]; then
    echo "📦 Root node_modules not found or empty. Installing dependencies..."
    cd /app
    yarn install --frozen-lockfile
    cd /app/apps/frontend
fi

# Check if frontend node_modules exists
if [ ! -d "/app/apps/frontend/node_modules" ] || [ -z "$(ls -A /app/apps/frontend/node_modules 2>/dev/null)" ]; then
    echo "📦 Frontend node_modules not found or empty. Installing dependencies..."
    cd /app
    yarn install --frozen-lockfile
    cd /app/apps/frontend
fi

echo "🚀 Starting application..."
exec "$@"
