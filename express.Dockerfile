# FROM node:22-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# COPY express/package*.json ./express/
# RUN cd express && npm ci
# COPY express ./express/
# COPY shared/ ./shared/
# RUN npm run build
#
# FROM node:22-alpine
# WORKDIR /app
# ENV NODE_ENV=production
# COPY package*.json ./
# COPY express/package*.json ./express/
# COPY --from=builder /app/express/build ./build
# USER node
# ENV PORT=3000
# EXPOSE 3000
# CMD ["node",  "dist/express/src/index.js"]


FROM node:22-alpine AS builder
WORKDIR /app

COPY package*.json ./
COPY express/package*.json ./express/
COPY shared/db/package*.json ./shared/db/

RUN cd express && npm ci
RUN cd shared/db && npm ci

COPY express ./express/
COPY shared/ ./shared/

RUN cd shared/db && npm run build
RUN cd express && npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production

COPY package*.json ./
COPY express/package*.json ./express/
COPY shared/db/package*.json ./shared/db/

COPY --from=builder /app/express/node_modules ./express/node_modules
COPY --from=builder /app/express/dist ./express/dist
COPY --from=builder /app/shared/db/node_modules ./shared/db/node_modules
COPY --from=builder /app/shared/db/ ./shared/db

USER node
ENV PORT=3000
EXPOSE 3000

CMD ["node", "express/dist/express/src/index.js"]
