async function createServer() {
  const { default: express } = await import('express')
  const { createServer } = await import('vite')
  const { Miniflare } = await import('miniflare')
  const esbuild = await import('esbuild')
  const path = await import('path')

  let context

  const wsFile = path.join(process.cwd(), '/src/lib/websockets/index.js')
  const doFile = path.join(process.cwd(), '/src/lib/durable-objects/index.js')
  const { outputFiles: [{ text: wsCode }, { text: doCode }] } = await esbuild.build({
    entryPoints: [wsFile, doFile],
    bundle: true,
    platform: 'neutral',
    write: false,
    outdir: 'out',
    watch: {
      onRebuild(error, result) {
        if (error) 
          console.error(error)
        else {
          const { outputFiles: [{ text: wsCode }, { text: doCode }] } = result
          return mf.setOptions({ script: wsCode + doCode })
        } 
      },
    },
  })

  const mf = new Miniflare({
    script: wsCode + doCode, // text,
    port: 3030,

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

    globals: { 
      CTX: (ctx) => context = ctx,
    },
  })

  await mf.dispatchFetch('https://host.tld')
  
  const globalScope = await mf.getGlobalScope()

  Object
  .entries(globalScope)
  .forEach(([key, val]) => global[key] = global[key] || val)

  const env = await mf.getBindings()
  const platform = { mf, env, context }

  const server = await mf.createServer()
  const { HTTPPlugin } = await mf.getPlugins()

  server.listen(HTTPPlugin.port)

  const app = express()
  const vite = await createServer()

  app.use(({ next }) => {
    process._platform = platform
    next()
  })

  app.use(vite.middlewares)

  app.listen(3000)
}

createServer()