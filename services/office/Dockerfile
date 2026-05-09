
## Stage 1. Compile TS sources to JS
FROM node:16.13.1-alpine3.13 as builder

# Set build directory
WORKDIR /app

# Install dev dependencies
COPY package.json yarn.lock tsconfig.json tsconfig.build.json nest-cli.json ./
RUN yarn install --frozen-lockfile --dev

# Copy sources
COPY src/ ./src/

# Build app
RUN yarn build


## Stage 2. Run built app
# Note: node:12-alpine could not be used here due to weak bcrypt support:
# https://github.com/kelektiv/node.bcrypt.js/wiki/Installation-Instructions#alpine-linux-based-images
FROM node:16.13.1-alpine3.13

# Set app directory
WORKDIR /app

# Install app dependencies
COPY package.json yarn.lock tsconfig.json ./
RUN yarn install --frozen-lockfile --production

COPY --from=builder /app/dist/ ./dist/

ENV PORT 80

CMD [ "yarn", "start:prod" ]
