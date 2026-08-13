FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY colyseus/package*.json ./colyseus/
RUN npm ci
COPY colyseus ./colyseus/
COPY shared/ ./shared/
RUN cd colyseus && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY colyseus/package*.json ./colyseus/
COPY --from=builder /app/colyseus/build ./build
USER node
ENV PORT=3000
EXPOSE 3000
CMD ["node",  "build/colyseus/src/index.js"]
