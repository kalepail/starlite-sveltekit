import { Miniflare } from 'miniflare'
import express from 'express'
import { createServer } from 'vite'
import esbuild from 'esbuild'
import path from 'path'

async function createMiniflareServer() {
  const bindingsFile = path.join(process.cwd(), '/src/lib/bindings.js')
  const { outputFiles: [{ text }] } = await esbuild.build({
    entryPoints: [bindingsFile],
    bundle: true,
    platform: 'neutral',
    write: false,
    watch: {
      onRebuild(error, result) {
        if (error) 
          console.error(error)
        else {
          const { outputFiles: [{text}] } = result
          return mf.setOptions({ script: text })
        } 
      },
    },
  })

  const mf = new Miniflare({
    script: text,
    port: 3030,
    // watch: true,

    modules: true,
    envPath: './.env.development.local',
    packagePath: true,
    wranglerConfigPath: './wrangler.development.toml',

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