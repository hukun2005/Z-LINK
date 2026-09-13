import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'

function rewriteLocalModelPath(url: string | undefined) {
  return url?.replace(
    /^\/models\/([^/]+)\/resolve\/main\//,
    '/models/$1/'
  )
}

function rejectMissingModelAsset(
  request: { url?: string },
  response: { statusCode: number; setHeader: (name: string, value: string) => void; end: (body: string) => void },
  publicDir: string,
) {
  const pathname = new URL(request.url ?? '/', 'http://localhost').pathname
  if (!pathname.startsWith('/models/')) return false

  const filePath = path.join(publicDir, pathname.slice('/'.length))
  if (fs.existsSync(filePath)) return false

  response.statusCode = 404
  response.setHeader('Content-Type', 'application/json')
  response.end(JSON.stringify({ error: 'Model asset not found', path: pathname }))
  return true
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'rewrite-local-model-path',
      configureServer(server) {
        server.middlewares.use((request, response, next) => {
          request.url = rewriteLocalModelPath(request.url)
          if (rejectMissingModelAsset(request, response, server.config.publicDir)) return
          next()
        })
      },
      configurePreviewServer(server) {
        server.middlewares.use((request, response, next) => {
          request.url = rewriteLocalModelPath(request.url)
          if (rejectMissingModelAsset(request, response, server.config.publicDir)) return
          next()
        })
      },
    },
  ],
   server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
   open: true,
  },
  optimizeDeps: {
    exclude: ['@mlc-ai/web-llm', '@huggingface/transformers'],
  }
})
