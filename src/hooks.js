import { dev } from '$app/env'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { request, routeId, url } = event
  const { headers } = request
  const { pathname } = url

  /* START.TOSSME */
  const { createMiniflareServer } = await import('./_servers.js')
  event.platform = await createMiniflareServer(false)
  /* END.TOSSME */

  if (headers.get('upgrade') === 'websocket') {
    
    // 3000 (vite / sveltekit) doesn't support websockets so forward the request to Miniflare server
    if (
      dev
      && url.port === '3000'
    ) return new Response(null, {
      status: 307,
      headers: {
        'Location': url.href.replace(/:\d+/gi, ':3030')
      }
    })

    // Only ever called on prod as the 3030 port is running custom code not svelte code
    // const { default: { fetch }} = await import(`./lib/bindings.js`)
    const { ws } = await import('./routes/connect/[id]/ws.js')

    return new Response(null, await ws(event))
    ////
  }

  return resolve(event)
}