
FROM node:20-alpine AS deps

WORKDIR /app

COPY frontend/package.json frontend/package-lock.json ./

RUN npm ci


FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY frontend/ ./


# ------------------------------------------------------------------
# Build-time environment variables
# ------------------------------------------------------------------
# BACKEND_ORIGIN is required here because next.config.ts evaluates:
#
# const BACKEND_URL =
#   process.env.BACKEND_ORIGIN ?? "http://localhost:8000";
#
# during `next build`.
#
# Without this ARG + ENV pair, Next.js permanently bakes
# http://localhost:8000 into the standalone server bundle.
# ------------------------------------------------------------------

ARG NEXT_PUBLIC_SITE_URL=http://localhost:3000
ARG API_INTERNAL_URL=http://backend:8000/api/v1
ARG BACKEND_ORIGIN=http://backend:8000

ENV NEXT_PUBLIC_SITE_URL=${NEXT_PUBLIC_SITE_URL} \
    API_INTERNAL_URL=${API_INTERNAL_URL} \
    BACKEND_ORIGIN=${BACKEND_ORIGIN}


# Build the production Next.js application.
RUN npm run build


FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

RUN addgroup -S nodejs && adduser -S nextjs -G nodejs


# ------------------------------------------------------------------
# Copy standalone Next.js production output
# ------------------------------------------------------------------

COPY --from=builder /app/public ./public

COPY --from=builder \
    --chown=nextjs:nodejs \
    /app/.next/standalone ./

COPY --from=builder \
    --chown=nextjs:nodejs \
    /app/.next/static ./.next/static


# ------------------------------------------------------------------
# Run as non-root user
# ------------------------------------------------------------------

USER nextjs

EXPOSE 3000


# Next.js standalone server configuration
ENV PORT=3000 \
    HOSTNAME=0.0.0.0


CMD ["node", "server.js"]
