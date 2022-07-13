import { wsResolve } from './lib/websockets/index.js'

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const { request } = event
  const { headers } = request

  event.platform = event.platform || process._platform

  if (headers.get('upgrade') === 'websocket')
    return wsResolve(event)

  return resolve(event)
}