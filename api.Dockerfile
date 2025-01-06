# syntax=docker/dockerfile:1.7-labs
FROM node:22.12.0-alpine3.21
RUN apk update && apk upgrade && apk add rsync
WORKDIR /api
RUN mkdir data-pulse
RUN mkdir current
COPY ./package*.json ./data-pulse
WORKDIR /api/data-pulse
RUN npm ci
WORKDIR /api
COPY --exclude=./package*.json . ./data-pulse
WORKDIR /api/data-pulse
RUN npm run migration:build
RUN cp ./dist/apps/api/package*.json ../current
WORKDIR /api/current
RUN npm ci
RUN rsync -av --exclude='package*' ../data-pulse/dist/apps/api/ ../current/
RUN addgroup api && adduser -S -G api api
COPY /etc/letsencrypt/live/plesk.mike-westermann.de/*.pem /etc/letsencrypt/live/plesk.mike-westermann.de/
RUN chmod +x startup.sh
RUN chown api:api startup.sh
USER api

EXPOSE 3000
ENTRYPOINT [ "./startup.sh" ]