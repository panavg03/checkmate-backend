FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY colyseus/package*.json ./colyseus/
COPY shared/db/package*.json ./shared/db/

RUN cd colyseus && npm ci
RUN cd shared/db && npm ci

COPY colyseus ./colyseus/
COPY shared/ ./shared/

RUN cd shared/db && npm run build
RUN cd colyseus && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY colyseus/package*.json ./colyseus/
COPY shared/db/package*.json ./shared/db/

COPY --from=builder /app/colyseus/node_modules ./colyseus/node_modules
COPY --from=builder /app/colyseus/build ./colyseus/build
COPY --from=builder /app/shared/db/node_modules ./shared/db/node_modules
COPY --from=builder /app/shared/db/ ./shared/db

USER node
ENV PORT=3000
EXPOSE 3000

CMD ["node", "colyseus/build/colyseus/src/index.js"]
