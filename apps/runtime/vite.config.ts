import { defineConfig } from 'vite'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  server: {
    port: 3001,
    open: true,
    fs: {
      allow: ['../..']
    },
    // Serve files in /projects/ from the monorepo root directory
    headers: {
      'Cache-Control': 'no-store',
    }
  },
  plugins: [
    {
      name: 'serve-projects',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/projects/')) {
            const cleanUrl = req.url.split('?')[0]
            const filePath = path.resolve(__dirname, '../..', cleanUrl.substring(1))
            if (fs.existsSync(filePath)) {
              res.setHeader('Content-Type', getMimeType(filePath))
              res.end(fs.readFileSync(filePath))
              return
            }
          }
          next()
        })
      }
    }
  ],
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})

function getMimeType(file: string): string {
  if (file.endsWith('.json')) return 'application/json'
  if (file.endsWith('.png')) return 'image/png'
  if (file.endsWith('.jpg') || file.endsWith('.jpeg')) return 'image/jpeg'
  if (file.endsWith('.js')) return 'application/javascript'
  if (file.endsWith('.css')) return 'text/css'
  return 'application/octet-stream'
}

