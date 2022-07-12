import { dev } from '$app/env'
import _mf from './_mf'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { request, routeId, url } = event
  const { headers } = request
  const { pathname } = url

  event.platform = await _mf(event.platform)

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

    const { default: { fetch }} = await import(`./lib/bindings.js`)

    console.log(event.platform)

    return new Response(null, await fetch(request, event.platform.env, event.platform.context))
  }

  return resolve(event)
}