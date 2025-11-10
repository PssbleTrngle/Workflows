FROM oven/bun:1 AS base
WORKDIR /usr/src/

FROM base AS turbo

RUN bun --global add turbo@^2

# prune repository
FROM turbo AS prepare

COPY . .

RUN turbo prune @pssbletrngle/webhooks-server --docker

# install dependencies and build project
FROM turbo AS builder

COPY --from=prepare /usr/src/out/json/ .
RUN bun install --frozen-lockfile --production

COPY --from=prepare /usr/src/out/full/ .
RUN bun run build

# run the app
FROM base AS runner

ENV NODE_ENV=production

COPY --from=builder --chown=bun:bun /usr/src/app/dist ./app
# required for generator metadata
# COPY generator/package.json generator/
# COPY generator/templates generator/templates

ENV GITHUB_APP_PRIVATE_KEY_FILE=/usr/private-key.pem
ENV GIT_CLONE_DIR=/usr/tmp
RUN mkdir "$GIT_CLONE_DIR" && chown bun:bun "$GIT_CLONE_DIR"

USER bun
EXPOSE 8080/tcp
ENTRYPOINT [ "bun", "run", "app/main.js" ]