# syntax=docker/dockerfile:1.7-labs
FROM node:20.15.0-alpine3.20 AS build
WORKDIR /app
COPY ./package*.json .
RUN npm ci
COPY --exclude=./package*.json . .
RUN npx nx run client:build

FROM nginx
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=build /app/dist/apps/client/browser /usr/share/nginx/html
