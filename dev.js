import { Miniflare } from 'miniflare'
import express from 'express'
import { createServer } from 'vite'

async function createMiniflareServer() {
  const mf = new Miniflare({
    scriptPath: './worker-site/worker.mjs',
    port: 3030,
    watch: true,

    modules: true,
    envPath: true,
    packagePath: true,
    wranglerConfigPath: true,

    kvPersist: true,
    cachePersist: true,
    durableObjectsPersist: true,

    globalAsyncIO: true,
    globalTimers: true,
    globalRandom: true,
  })

  const server = await mf.createServer()
  const { HTTPPlugin } = await mf.getPlugins()

  server.listen(HTTPPlugin.port)
}

// TODO push mf object to vite so it could be referenced in the hook vs using the _mf file
  // Primarily so we don't have to double snag the durable object files

async function createViteServer() {
  const app = express()

  const vite = await createServer()

  app.use(vite.middlewares)

  app.listen(3000)
}

createMiniflareServer()
createViteServer()