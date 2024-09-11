# Builder image
# =============

FROM node:22.8.0-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run apidoc && \
    npm prune --production

# Production image
# ================

FROM node:22.8.0-alpine

ENV NODE_ENV=production \
    PORT=3000

WORKDIR /app

RUN addgroup -S demo && \
    adduser -D -G demo -H -s /usr/bin/nologin -S demo && \
    chown demo:demo /app

USER demo:demo

COPY --chown=demo:demo --from=builder /app /app

CMD ["node", "./bin/www.js"]

EXPOSE 3000