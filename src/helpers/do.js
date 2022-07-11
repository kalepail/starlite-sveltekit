const encoder = new TextEncoder()
const decoder = new TextDecoder()

export class Sockets {
  constructor(state, env) {
    this.env = env
    this.state = state
    this.storage = state.storage
    this.sockets = {}
  }

  async fetch(req) {
    const { url } = req
    const [ type, id ] = url.split('/').reverse()

    switch(type) {
      case 'ws':
        return this.handleSocket(id)

      default:
        return new Response('\u00AF\\_(\u30C4)_\/\u00AF', {
          status: 404
        })
    }
  }

  async handleSocket(id) {
    const [client, server] = Object.values(new WebSocketPair())
    this.sockets[id] = server

    server.accept()

    server.addEventListener('message', async (event) => {
      const id = decoder.decode(event.data.slice(0, 3))
      const data = event.data.slice(3)
      const socket = this.sockets[id]

      try {
        if (socket)
          socket.send(data)
      } catch {}
    })

    server.addEventListener('close', async (event) => {
      const socket = this.sockets[event.reason]

      if (socket) {
        delete this.sockets[event.reason]

        try {
          socket.close(1000)
        } catch {}
      }
    })

    server.addEventListener('error', (event) => {
      console.error(event)
    })

    return new Response(null, {
      status: 101,
      webSocket: client
    })
  }
}