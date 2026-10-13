# syntax=docker/dockerfile:1

# Dependencies: cached until package-lock.json changes.
FROM node:26-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Build: produces the standalone server bundle.
FROM node:26-alpine AS build
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
# No build args, and none wanted: every env value is read server side at
# runtime, so one image runs in any environment.
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Runtime: minimal standalone output, non-root.
FROM node:26-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs
USER nextjs

# Standalone bundles a minimal server + only the node_modules actually used.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
# No public/ dir yet; uncomment when one is added:
# COPY --from=build --chown=nextjs:nodejs /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
