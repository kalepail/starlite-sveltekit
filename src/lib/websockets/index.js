import { get } from '../../routes/connect/[id]/ws.js'

export function resolveWs(event) {
  if (/^\/connect\/.*\/ws$/.test(event.url.pathname))
    return get(event)

  return new Response(null, { status: 404 })
}

const handler = {
  fetch(req, env, ctx) {
    if (global.CTX)
      CTX(ctx)

    const url = new URL(req.url)
    const { pathname } = url
    const [,, id] = pathname.split('/')

    const event = {
      request: req,
      platform: {
        env,
        context: ctx
      },
      params: {
        id
      },
      url
    }

    return resolveWs(event)
  }
}

export {
  handler as default
}