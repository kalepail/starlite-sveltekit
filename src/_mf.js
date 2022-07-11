// https://github.com/sveltejs/kit/issues/4292

import { dev } from '$app/env'

let context

export default async (_platform) => {
  if (!dev)
    return _platform

  if (_platform)
    return _platform

  const esbuild = await import('esbuild')
  const path = await import('path')
  const fs = await import('fs')

  const doFile = path.join(process.cwd(), '/src/helpers/do.js')
  const doCode = fs.readFileSync(doFile).toString('utf8')
  
  const { code } = esbuild.transformSync(`
    export default {
      fetch: async (req, env, ctx) => {
        CTX(ctx)
        return new Response(null, {status: 204});
      }
    };
    ${doCode};
    `
  )

  const { Miniflare } = await import('miniflare')
  const mf = new Miniflare({
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
    
    script: code,
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