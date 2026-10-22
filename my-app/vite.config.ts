import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import Components from 'unplugin-vue-components/vite'
import { AntDesignVueResolver } from 'unplugin-vue-components/resolvers'
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
    vue(),
    tailwindcss(),
    Components({
      resolvers: [
        AntDesignVueResolver({
          importStyle: false,
        }),
      ],
    }),
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
  build: {
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (!id.includes('node_modules')) return
          if (id.includes('ant-design-vue') || id.includes('@ant-design/icons-vue')) return 'antd-vendor'
          if (id.includes('three')) return 'three-vendor'
          if (id.includes('axios')) return 'axios-vendor'
          if (
            id.includes('vue-router') ||
            id.includes('pinia') ||
            id.includes('/node_modules/vue/') ||
            id.includes('/node_modules/@vue/')
          ) return 'vue-vendor'
        },
      },
    },
  },
})
