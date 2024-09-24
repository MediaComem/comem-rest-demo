# Builder image
# =============

FROM node:22.9.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm prune --production

# Production image
# ================

FROM node:22.9.0-alpine

ENV NODE_ENV=production \
    PORT=3000

LABEL org.opencontainers.image.authors="simon.oulevay@heig-vd.ch"

WORKDIR /app

RUN addgroup -S demo && \
    adduser -D -G demo -H -s /usr/bin/nologin -S demo && \
    chown demo:demo /app

USER demo:demo

COPY --chown=demo:demo --from=builder /app /app

CMD ["node", "./bin/www.js"]

EXPOSE 3000
