# Dependencies are installed separately to maximize Docker layer-cache reuse.
FROM node:22-alpine AS dependencies
WORKDIR /app
COPY package.json ./
RUN npm install --include=dev

FROM dependencies AS build
COPY tsconfig.json ./
COPY src ./src
COPY tests ./tests
RUN npm run build

FROM node:22-alpine AS production-dependencies
WORKDIR /app
COPY package.json ./
RUN npm install --omit=dev && npm cache clean --force

FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app
COPY --from=production-dependencies --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist/src ./dist
USER node
CMD ["node", "dist/server.js"]
