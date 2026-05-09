/**
 * Orval spec transformer.
 * 1. Adds missing path parameters to operations that reference {param} in the URL
 *    but forget to declare them in the parameters array (a bug in the spec).
 * 2. Deduplicates operationIds across paths so that every operation gets a unique
 *    name and orval generates hooks for all of them. The first occurrence keeps
 *    the original id; subsequent duplicates get a numeric suffix (_2, _3, …).
 *
 * @param {import('openapi-types').OpenAPIObject} spec
 * @returns {import('openapi-types').OpenAPIObject}
 */
module.exports = (spec) => {
  const paths = spec.paths ?? {}
  const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']

  // Pass 1: fix missing path parameters
  for (const [path, pathItem] of Object.entries(paths)) {
    const pathParams = (path.match(/\{([^}]+)\}/g) ?? []).map((p) => p.slice(1, -1))
    if (pathParams.length === 0) continue

    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation || typeof operation !== 'object') continue

      const declared = (operation.parameters ?? [])
        .filter((p) => p.in === 'path')
        .map((p) => p.name)

      const missing = pathParams.filter((p) => !declared.includes(p))
      if (missing.length === 0) continue

      operation.parameters = [
        ...(operation.parameters ?? []),
        ...missing.map((name) => ({
          name,
          in: 'path',
          required: true,
          schema: { type: 'string' },
        })),
      ]
    }
  }

  // Pass 2: deduplicate operationIds — keep the first occurrence as-is,
  // rename subsequent duplicates with a _2, _3, … suffix.
  const seenIds = new Map() // operationId → count of times seen so far

  for (const pathItem of Object.values(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation || typeof operation !== 'object' || !operation.operationId) continue

      const id = operation.operationId
      if (!seenIds.has(id)) {
        seenIds.set(id, 1)
      } else {
        const count = seenIds.get(id) + 1
        seenIds.set(id, count)
        operation.operationId = `${id}_${count}`
      }
    }
  }

  // Pass 3: fix health check response schemas.
  // @nestjs/terminus emits an index-signature schema where `status` is optional
  // but `additionalProperties` is `string`. TypeScript rejects optional properties
  // that are narrower than the index signature, so we mark `status` as required.
  for (const pathItem of Object.values(paths)) {
    for (const method of HTTP_METHODS) {
      const operation = pathItem[method]
      if (!operation || typeof operation !== 'object') continue

      for (const response of Object.values(operation.responses ?? {})) {
        const schema = response?.content?.['application/json']?.schema
        if (!schema?.properties) continue

        for (const fieldSchema of Object.values(schema.properties)) {
          const nested = fieldSchema?.additionalProperties
          if (
            nested &&
            typeof nested === 'object' &&
            nested.properties?.status &&
            nested.additionalProperties?.type === 'string'
          ) {
            // Ensure `status` is listed as required so Orval emits `status: string`
            // instead of `status?: string`, which conflicts with the index signature.
            nested.required = [...new Set([...(nested.required ?? []), 'status'])]
          }
        }
      }
    }
  }

  return spec
}
