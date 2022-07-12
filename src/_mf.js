// https://github.com/sveltejs/kit/issues/4292

import { dev } from '$app/env'

export default async (_platform) => {
  if (!dev)
    return _platform

  if (_platform)
    return _platform

  const esbuild = await import('esbuild')
  const path = await import('path')

  let context

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

  const { Miniflare } = await import('miniflare')
  const mf = new Miniflare({
    script: text,
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

  await mf.dispatchFetch('https://host.tld')

  const globalScope = await mf.getGlobalScope()

  Object
  .entries(globalScope)
  .forEach(([key, val]) => {
    if (!global[key])
      global[key] = val
  })

  const env = await mf.getBindings()
  const platform = {env, context}

  return platform
}