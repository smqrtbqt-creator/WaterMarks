import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { BASENAME } from './src/base.ts'

function redirectRoot(): Plugin {
  return {
    name: 'redirect-root',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (path === '/') {
          res.writeHead(302, { Location: `${BASENAME}/` })
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  base: `${BASENAME}/`,
  build: {
    outDir: '../static/alcalinite',
    emptyOutDir: true,
  },
  plugins: [redirectRoot(), react(), tailwindcss()],
  server: {
    host: '127.0.0.1',
    port: 5175,
  },
})
