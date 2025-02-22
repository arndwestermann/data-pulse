# syntax=docker/dockerfile:1.7-labs
FROM node:22.12.0-alpine3.21 AS build
ARG ENVIRONMENT=dev
WORKDIR /app
COPY ./package*.json .
RUN npm ci
COPY --exclude=./package*.json . .
RUN npx nx run client:build:${ENVIRONMENT}

FROM nginx
ARG NGINX_CONFIG=nginx.conf
COPY ${NGINX_CONFIG} /etc/nginx/nginx.conf
COPY /ssl/*.pem /etc/nginx/ssl/
COPY --from=build /app/dist/apps/client/browser /usr/share/nginx/html
