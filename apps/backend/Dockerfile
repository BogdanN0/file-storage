FROM node:20-alpine

# Install OpenSSL for Prisma
RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Copy package.json files to install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY apps/backend/package.json ./apps/backend/
COPY packages/shared/package.json ./packages/shared/

# Enable corepack and install dependencies
RUN corepack enable && \
    yarn install --frozen-lockfile

# Copy the entire codebase
COPY . .

WORKDIR /app/apps/backend

# Generate Prisma client
RUN yarn prisma generate

# Create uploads directory with correct permissions
RUN mkdir -p /app/uploads && \
    chmod 777 /app/uploads

# Copy entrypoint script
COPY apps/backend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["yarn", "start:dev"]
