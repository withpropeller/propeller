.PHONY: install dev build start lint generate fetch-spec setup

install:
	bun install

dev:
	bun run dev

build:
	bun run build

start:
	bun run start

lint:
	bun run lint

# Download the OpenAPI spec from a running services/gateway (ENABLE_SWAGGER=true, default :4000).
# Start with: cd services/gateway && bun run start:dev
fetch-spec:
	mkdir -p docs
	curl -sSfL http://localhost:4000/openapi.json -o docs/openapi.json
	@echo "spec saved to docs/openapi.json"

generate:
	bun run generate

setup: install fetch-spec generate
	@echo "setup complete"
