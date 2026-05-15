.PHONY: install dev build start lint generate fetch-spec setup

# Install dependencies
install:
	npm install

# Start dev server
dev:
	npm run dev

# Build for production
build:
	npm run build

# Start production server
start:
	npm run start

# Run linter
lint:
	npm run lint

# Download the OpenAPI spec locally (so codegen works offline / in CI)
fetch-spec:
	mkdir -p docs
	curl -sSfL https://localhost:8000/openapi.json -o docs/openapi.json
	@echo "✓ Spec saved to docs/openapi.json"

# Run Orval codegen (requires spec at docs/openapi.json)
generate:
	npm run generate

# Full first-time setup: install deps, fetch spec, generate client
setup: install fetch-spec generate
	@echo "✓ Setup complete"
