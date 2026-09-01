# syntax=docker/dockerfile:1

# Multi-stage build producing a slim, standalone Next.js runtime.
#
# No API keys are required. NEXT_PUBLIC_* values are inlined into the client
# bundle at BUILD time, so branding and the public site URL are build args, not
# runtime env vars. Everything else (rate limits, timeouts, cache TTLs, CSP
# mode) is read at runtime and can be changed with a container restart.

# 1) Install dependencies (cached unless package*.json change)
FROM node:22-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# 2) Build the standalone server bundle
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time public configuration (see .env.example)
ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG NEXT_PUBLIC_APP_NAME=IRONSIGHT
ARG NEXT_PUBLIC_APP_SHORT=IRONSIGHT
ARG NEXT_PUBLIC_APP_TAGLINE="OSINT COMMAND CENTER // UNCLASSIFIED"
ARG NEXT_PUBLIC_APP_DESCRIPTION=""
ARG NEXT_PUBLIC_OPERATOR_NAME=""
ARG NEXT_PUBLIC_OPERATOR_URL=""
ARG NEXT_PUBLIC_CONTACT=""
ARG NEXT_PUBLIC_ENABLED_THEATERS=""
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL \
    NEXT_PUBLIC_APP_NAME=$NEXT_PUBLIC_APP_NAME \
    NEXT_PUBLIC_APP_SHORT=$NEXT_PUBLIC_APP_SHORT \
    NEXT_PUBLIC_APP_TAGLINE=$NEXT_PUBLIC_APP_TAGLINE \
    NEXT_PUBLIC_APP_DESCRIPTION=$NEXT_PUBLIC_APP_DESCRIPTION \
    NEXT_PUBLIC_OPERATOR_NAME=$NEXT_PUBLIC_OPERATOR_NAME \
    NEXT_PUBLIC_OPERATOR_URL=$NEXT_PUBLIC_OPERATOR_URL \
    NEXT_PUBLIC_CONTACT=$NEXT_PUBLIC_CONTACT \
    NEXT_PUBLIC_ENABLED_THEATERS=$NEXT_PUBLIC_ENABLED_THEATERS \
    NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# 3) Minimal runtime image — only the standalone output + static assets
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# wget is used by the healthcheck below
RUN apk add --no-cache wget && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nextjs -u 1001

# The standalone output includes a minimal server.js + only the node_modules it needs
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:3000/api/health >/dev/null || exit 1

CMD ["node", "server.js"]
