FROM oven/bun:1 AS base
WORKDIR /usr/src/

FROM base AS turbo

RUN bun --global add turbo@^2

# prune repository
FROM turbo AS prepare

COPY . .

RUN turbo prune @pssbletrngle/workflows-consumer --docker

# install dependencies and build project
FROM turbo AS builder

COPY --from=prepare /usr/src/out/bun.lock .
COPY --from=prepare /usr/src/out/json/ .
RUN bun install --frozen-lockfile --production

COPY --from=prepare /usr/src/out/full/ .
RUN bun run build

# run the app
FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder --chown=bun:bun /usr/src/apps/consumer/dist ./consumer

USER bun
EXPOSE 8080/tcp
ENTRYPOINT [ "bun", "run", "consumer/main.js" ]