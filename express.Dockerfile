# FROM node:22-alpine AS builder
# WORKDIR /app
# COPY package*.json ./
# RUN npm ci
# COPY . .
# RUN npm run build
#
# FROM node:22-alpine
# WORKDIR /app
# ENV NODE_ENV=production
# COPY package*.json ./
# # RUN npm ci --omit=dev && npm cache clean --force
# COPY --from=builder /app/dist ./dist
# USER node
# ENV PORT=3000
# EXPOSE 3000
# CMD ["node", "dist/express/src/index.js"]


FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
COPY express/package*.json ./express/
RUN cd express && npm ci
COPY express ./express/
COPY shared/ ./shared/
RUN npm run build

FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package*.json ./
COPY express/package*.json ./express/
COPY --from=builder /app/express/build ./build
USER node
ENV PORT=3000
EXPOSE 3000
CMD ["node",  "dist/express/src/index.js"]
