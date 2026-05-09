import { defineConfig } from 'orval'

export default defineConfig({
  issuing: {
    input: {
      target: './docs/openapi.json',
    },
    output: {
      mode: 'split',
      target: './src/api',
      client: 'react-query',
      mock: false,
      override: {
        mutator: {
          path: './src/lib/orvalClient.ts',
          name: 'customInstance',
        },
      },
    },
  },
})
