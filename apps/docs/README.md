# @propeller/docs

Static Scalar API reference site for `apps/api`.

In dev: open `http://localhost:3004` — loads `apps/api`'s OpenAPI from `:3001/openapi.json`.

In prod: build emits the `apps/api` OpenAPI to a static JSON file, this site picks it up at the configured URL.

The HTML is intentionally minimal — Scalar handles all rendering via its CDN script.
