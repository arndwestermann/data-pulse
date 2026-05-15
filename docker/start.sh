#!/bin/bash
set -e

# Install pnpm globally
npm install -g pnpm

cd /app

# Install gosu if not present
if ! command -v gosu &> /dev/null; then
    apt-get update && apt-get install -y gosu && rm -rf /var/lib/apt/lists/*
fi

if ! id -u "$APP_USER" &>/dev/null; then
    groupadd -g "$APP_GROUP" appgroup || true
    useradd -m -u "$APP_USER" -g "$APP_GROUP" -s /bin/bash appuser || true
fi

# Change ownership
chown -R $APP_USER:$APP_GROUP /app

# Run everything as the specified user
gosu $APP_USER:$APP_GROUP pnpm install --frozen-lockfile

# Run migrations only if the database config file exists
if [ -f "./database/database.config.js" ]; then
    gosu $APP_USER:$APP_GROUP npx -c "PRODUCTION=true typeorm -d ./database/database.config.js migration:run"
fi

exec gosu $APP_USER:$APP_GROUP node main.js
