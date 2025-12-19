FROM node:20-alpine

WORKDIR /app

# Copy package.json files to install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
COPY apps/frontend/package.json ./apps/frontend/
COPY packages/shared/package.json ./packages/shared/

# Enable corepack and install dependencies
RUN corepack enable && \
    yarn install --frozen-lockfile

# Copy the entire codebase
COPY . .

WORKDIR /app/apps/frontend

# Copy entrypoint script
COPY apps/frontend/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

ENTRYPOINT ["/entrypoint.sh"]
CMD ["yarn", "dev"]
