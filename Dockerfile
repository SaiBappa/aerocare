FROM node:22-slim AS builder

WORKDIR /app

# Enable corepack/pnpm if needed, but we use npm
COPY package.json ./

# Install all dependencies (including dev) so Vite and everything else can build
RUN npm install --legacy-peer-deps

COPY . .

# Build the frontend bundle
RUN npm run build

# Start a fresh image for the runtime
FROM node:22-slim

WORKDIR /app

# Install production dependencies only to keep the image small
# Also install sqlite3 since we are using better-sqlite3 which may need compilation
# or the prebuilds might need some shared libraries
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install --omit=dev --legacy-peer-deps

# Copy the built frontend and backend code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/server.ts ./
COPY --from=builder /app/server ./server
COPY --from=builder /app/.env.local ./.env.local

# Allow Cloud Run to set the PORT
ENV PORT=8080
ENV NODE_ENV=production

# Let Cloud Run specify port
EXPOSE 8080

CMD ["npm", "start"]
