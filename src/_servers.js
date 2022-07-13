export async function createMiniflareServer(start) {
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
          return mf.setOptions({ script: doCode + wsCode })
        } 
      },
    },
  })

  const mf = new Miniflare({
    script: doCode + wsCode,
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

    globals: { CTX: (ctx) => context = ctx },
  })

  if (start) {
    const server = await mf.createServer()
    const { HTTPPlugin } = await mf.getPlugins()

    server.listen(HTTPPlugin.port)

    return { mf }
  }

  else {
    await mf.dispatchFetch('https://host.tld')

    const globalScope = await mf.getGlobalScope()

    Object
    .entries(globalScope)
    .forEach(([key, val]) => {
      if (!global[key])
        global[key] = val
    })

    const env = await mf.getBindings()

    return { mf, env, context }
  }
}

export async function createViteServer(start) {
  const { default: express } = await import('express')
  const { createServer } = await import('vite')

  const app = express()

  const vite = await createServer()

  app.use(vite.middlewares)

  if (start)
    app.listen(3000)

  return app
}