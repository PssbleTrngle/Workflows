# use the official Bun image
# see all versions at https://hub.docker.com/r/oven/bun/tags
FROM oven/bun:1 AS base
WORKDIR /usr/src/

# install dependencies into temp directory
# this will cache them and speed up future builds
FROM base AS install
# RUN mkdir -p /temp/dev
# COPY package.json bun.lock /temp/dev/
# RUN cd /temp/dev && bun install --frozen-lockfile

# install with --production (exclude devDependencies)
WORKDIR /temp/prod

COPY package.json bun.lock .
COPY generator/package.json ./generator/
COPY app/package.json ./app/
RUN bun install --frozen-lockfile --production --linker hoisted

FROM base AS builder
# COPY --from=install /temp/dev/node_modules node_modules
COPY . .

# copy production dependencies and source code into final image
FROM base AS runner

ENV NODE_ENV=production

COPY --from=install /temp/prod/node_modules node_modules

COPY --from=builder /usr/src/app/src ./app/src
COPY --from=builder /usr/src/app/package.json ./app/

COPY --from=builder /usr/src/generator/src ./generator/src
COPY --from=builder /usr/src/generator/package.json ./generator/

ENV GITHUB_APP_PRIVATE_KEY_FILE=/usr/private-key.pem
ENV GIT_CLONE_DIR=/usr/tmp
RUN mkdir $GIT_CLONE_DIR
RUN chown bun:bun $GIT_CLONE_DIR

# run the app
USER bun
EXPOSE 8080/tcp
ENTRYPOINT [ "bun", "run", "app/src/main.ts" ]