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

# Download the OpenAPI spec locally (so codegen works offline / in CI)
fetch-spec:
	mkdir -p docs
	curl -sSfL https://localhost:8000/openapi.json -o docs/openapi.json
	@echo "spec saved to docs/openapi.json"

generate:
	bun run generate

setup: install fetch-spec generate
	@echo "setup complete"
