# syntax=docker/dockerfile:1.7-labs
FROM node:24.12.0-alpine3.23
RUN apk update && apk upgrade && apk add rsync
WORKDIR /api
RUN mkdir data-pulse
RUN mkdir current
RUN npm install -g pnpm
COPY ./package*.json ./pnpm-lock.yaml ./pnpm-workspace.yaml ./data-pulse
WORKDIR /api/data-pulse
RUN pnpm install --frozen-lockfile
WORKDIR /api
COPY --exclude=./package*.json --exclude=./pnpm-lock.yaml . ./data-pulse
WORKDIR /api/data-pulse
RUN pnpm run migration:build
RUN cp ./dist/apps/api/package*.json ./dist/apps/api/pnpm-lock.yaml ./pnpm-workspace.yaml ../current
WORKDIR /api/current
RUN pnpm install --frozen-lockfile
RUN rsync -av --exclude='package*' --exclude='pnpm-lock.yaml' ../data-pulse/dist/apps/api/ ../current/
RUN addgroup api && adduser -S -G api api
# COPY /ssl/*.pem /etc/letsencrypt/live/plesk.mike-westermann.de/
RUN chmod +x start.sh
RUN chown api:api start.sh
USER api

ENTRYPOINT [ "./start.sh" ]
