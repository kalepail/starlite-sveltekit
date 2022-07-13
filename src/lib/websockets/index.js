import { routes } from './routes'

export async function wsResolve(event) {
  let match

  const route = routes.find(({pattern}) => {
    match = event.url.pathname.match(pattern)
    return match
  })

  if (match) {
    if (!event.params) {
      const params = {}

      route.names.forEach((key, i) => params[key] = match[1 + i])
      event.params = params
    }

    const { get } = await route.fn
    
    return get(event)
  }

  return new Response(null, { status: 404 })
}

const handler = {
  fetch(req, env, ctx) {
    if (global.CTX)
      CTX(ctx)

    const event = {
      request: req,
      platform: {
        env,
        context: ctx
      },
      url: new URL(req.url)
    }

    return wsResolve(event)
  }
}

export {
  handler as default
}