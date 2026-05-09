# apps/admin — dev container (Vite hot-reload)
# Production build (static + nginx) added in a later slice.

FROM oven/bun:1-alpine
WORKDIR /app
COPY package.json bun.lock* ./
RUN bun install --silent
COPY . .
EXPOSE 3005
CMD ["bun", "run", "dev", "--host", "0.0.0.0"]
