import { Sockets } from './durable-objects/sockets.js'
import { ws } from '../routes/connect/[id]/ws.js'

const handler = {
  fetch(req, env, ctx) {
    if (globalThis.CTX)
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
      }
    }

    if (/^\/connect\/.*\/ws$/.test(pathname))
      return ws(event)

    return new Response(null, {status: 404})
  }
}

export {
  handler as default,
  Sockets
}