FROM node:22-alpine AS build
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY services/comments-stream/package.json ./services/comments-stream/package.json
COPY packages/shared-types/package.json ./packages/shared-types/package.json

RUN npm install

COPY services/comments-stream ./services/comments-stream
COPY packages/shared-types ./packages/shared-types

RUN npm run build --workspace @comment0r/comments-stream

FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/services/comments-stream/dist ./dist

ENV NODE_ENV=production
EXPOSE 3002

CMD ["node", "dist/index.js"]
