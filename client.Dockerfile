# syntax=docker/dockerfile:1.7-labs
FROM node:24.12.0-alpine3.23 AS build
ARG ENVIRONMENT=dev
WORKDIR /app
RUN npm install -g pnpm
COPY ./package*.json ./pnpm-lock.yaml .
RUN pnpm install --frozen-lockfile
COPY --exclude=./package*.json --exclude=./pnpm-lock.yaml . .
RUN npx nx run client:build:${ENVIRONMENT}

FROM nginx AS stable
RUN echo "RUN STABLE"
ARG NGINX_CONFIG=nginx.conf
COPY ${NGINX_CONFIG} /etc/nginx/nginx.conf
COPY /ssl/*.pem /etc/nginx/ssl/
COPY --from=build /app/dist/apps/client/browser /usr/share/nginx/html

FROM nginx AS experimental
RUN echo "RUN EXPERIMENTAL"
COPY --from=build /app/dist/apps/client/browser /usr/share/nginx/html
COPY --from=build /app/dist/apps/client/browser/nginx.conf /etc/nginx/nginx.conf

