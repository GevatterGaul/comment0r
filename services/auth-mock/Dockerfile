FROM node:22-alpine AS build
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY services/auth-mock/package.json ./services/auth-mock/package.json

RUN npm install

COPY services/auth-mock ./services/auth-mock

RUN npm run build --workspace @comment0r/auth-mock

FROM node:22-alpine
WORKDIR /app

COPY --from=build /app/package.json ./package.json
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/services/auth-mock/dist ./dist

ENV NODE_ENV=production
EXPOSE 3010

CMD ["node", "dist/index.js"]
