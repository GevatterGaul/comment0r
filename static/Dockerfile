FROM node:22-alpine AS build
WORKDIR /app

COPY package.json tsconfig.base.json ./
COPY packages/widget/package.json ./packages/widget/package.json
COPY packages/management-ui/package.json ./packages/management-ui/package.json

RUN npm install

COPY packages/widget ./packages/widget
COPY packages/management-ui ./packages/management-ui
COPY static ./static

RUN npm run build --workspace @comment0r/widget && npm run build --workspace @comment0r/management-ui

FROM nginx:1.27-alpine

COPY static/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/static /usr/share/nginx/html

EXPOSE 80
