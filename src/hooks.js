import { resolveWs } from './lib/websockets/index'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { request } = event
  const { headers } = request

  event.platform = event.platform || process._platform

  if (headers.get('upgrade') === 'websocket')
    return resolveWs(event)

  return resolve(event)
}