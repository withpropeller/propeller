import { defineConfig } from 'orval'

export default defineConfig({
  allaweeApi: {
    input: {
      target: './docs/openapi.json',
      override: {
        transformer: './src/lib/specTransformer.cjs',
      },
    },
    output: {
      // Split output into one file per tag, nested by tag path
      // e.g. src/api/cards.ts, src/api/tools/banks.ts
      mode: 'tags-split',
      target: './src/api',
      schemas: './src/api/model',
      client: 'react-query',
      override: {
        mutator: {
          path: './src/lib/orvalClient.ts',
          name: 'customInstance',
        },
        query: {
          useQuery: true,
          useMutation: true,
        },
      },
    },
  },
})
