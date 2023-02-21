# syntax = docker/dockerfile:experimental

ARG NODE_VERSION=lts-alpine
ARG APP_NAME=collector

FROM node:${NODE_VERSION} AS base

ARG APP_NAME

# it needs for git-based package in the packages.json
RUN apk add git
RUN npm i -g pnpm@7

WORKDIR /app

COPY .npmrc package* pnpm-*.yaml ./
COPY ./apps/$APP_NAME/package.json apps/$APP_NAME/

FROM base AS dependencies

RUN --mount=type=cache,id=pnpm-store,target=/cache/.pnpm-store pnpm install

FROM base AS polishing

RUN --mount=type=cache,id=pnpm-store,target=/cache/.pnpm-store pnpm install --prod

FROM dependencies AS builder

COPY . .
RUN pnpm build $APP_NAME

FROM node:${NODE_VERSION} AS release

ARG APP_NAME
ENV NODE_ENV=production

WORKDIR /app

COPY --chown=node:node --from=polishing /app/node_modules ./node_modules
COPY --chown=node:node --from=builder /app/package.json ./
COPY --chown=node:node --from=builder /app/dist/apps/${APP_NAME} ./dist

EXPOSE 3000

CMD ["node", "dist/main"]
