import { Sockets } from './durable-objects/sockets.js'
import { ws } from '../routes/connect/[id]/ws.js'

const handler = {
  fetch(req, env, ctx) {
    
    // Only ever called in dev
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

    if (
      global.CTX 
      || globalThis.CTX
    ) CTX(ctx)
    ////

    return new Response(null, {status: 404})
  }
}

export {
  handler as default,
  Sockets
}