import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
const BASENAME = '/redox'

function redirectOldPaths(): Plugin {
  return {
    name: 'redirect-old-paths',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (path === '/' || path === '/cours' || path === '/laboratoire' || path === '/exercices' || path === '/fiche') {
          res.writeHead(302, { Location: `${BASENAME}/` })
          res.end()
          return
        }
        if (path === '/quiz') {
          res.writeHead(302, { Location: `${BASENAME}/quiz` })
          res.end()
          return
        }
        next()
      })
    },
  }
}

export default defineConfig({
  base: './',
  build: {
    outDir: '../static/redox',
    emptyOutDir: true,
  },
  plugins: [redirectOldPaths(), react(), tailwindcss()],
})
