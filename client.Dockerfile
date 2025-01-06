# syntax=docker/dockerfile:1.7-labs
FROM node:22.12.0-alpine3.21 AS build
WORKDIR /app
COPY ./package*.json .
RUN npm ci
COPY --exclude=./package*.json . .
RUN npx nx run client:build

FROM nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY /etc/letsencrypt/live/plesk.mike-westermann.de/* /etc/nginx/ssl/
COPY --from=build /app/dist/apps/client/browser /usr/share/nginx/html
