import { Sockets } from './durable-objects/sockets.js'
import { ws } from '../routes/connect/[id]/ws.js'

const handler = {
  fetch(req, env, ctx) {
    // if (globalThis.CTX)
    //   CTX(ctx)

    const url = new URL(req.url)
    const { pathname } = url

    if (/^\/connect\/.*\/ws$/.test(pathname))
      return ws(req, env, ctx)

    return new Response(null, {status: 404})
  }
}

export {
  handler as default,
  Sockets
}