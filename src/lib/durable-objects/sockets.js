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

      case 'is':
        return this.isSocket(id)

      default:
        return new Response('\u00AF\\_(\u30C4)_\/\u00AF', {
          status: 404
        })
    }
  }

  async handleSocket(id) {
    const [client, server] = Object.values(new WebSocketPair())
    this.sockets[id] = {
      ...(this.sockets[id] || {}),
      ws: server
    }

    server.accept()

    server.addEventListener('message', async (event) => {
      const { id, ...data } = JSON.parse(decoder.decode(event.data))
      const socket = this.sockets[id]?.ws

      try {
        if (socket)
          socket.send(encoder.encode(JSON.stringify(data)))
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

  async isSocket(id) {
    if (this.sockets[id]?.initiator)
      return new Response(null, { 
        status: 204, 
        headers: {
          'Content-Type': 'text/plain'
        } 
      })
    else {
      this.sockets[id.split('-').reverse().join('-')] = {initiator: true}
      return new Response(null, { status: 404 })
    }
  }
}