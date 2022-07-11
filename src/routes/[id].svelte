<script>
import SimplePeer from 'simple-peer/simplepeer.min.js'
import { onMount } from 'svelte'
import { dev } from '$app/env'

import { generatePaymentChannelTx, generateOpenChannelTx } from '../helpers/paymentChannel'

let peer = null
let socket = null
let payments = []
let keypair = null
let sourceAccount = null
let totalPayments = 100
let countSent = 0
let countReceived = 0
let paymentsPerSecond = 0
let iceServers = undefined
let interval = null
let server = null
let payerIsFoo = false

onMount(async () => {
  const { Keypair, Networks, Server, Transaction } = await import('stellar-sdk')

  const encoder = new TextEncoder()
  const decoder = new TextDecoder()

  const [ payerId ] = location.pathname.split('/').reverse()
  const payerIdArr = encoder.encode(payerId)
  const payerIdLen = payerIdArr.length

  const payeeId = payerId === 'foo' ? 'bar' : 'foo'
  const payeeIdArr = encoder.encode(payeeId)
  const payeeIdLen = payeeIdArr.length

  const foo = dev ? 'SCUOSJDE2DJF3J4CL6I52HPTWZHRW4DAJXUQ44I4RG4HUBIQOXBALIYJ' : 'SBZBAOZNWO7XYUS6N46PEPOM7XZCC3NXHT3ZL32ZVP35XKVIHJ56EUFV'
  const bar = dev ? 'SB3ZBGKYG7MHRRK2YR3FL4IVUZLNYRIHTYYKNHEVH243VTBMEDE22BSH' : 'SANQNM3U2XIQR3VKVKZ5GVXSHW5EETUAFHA4QCPVFZAPBJJPENHLMU3A'

  payerIsFoo = payerId === 'foo'
  server = new Server('https://horizon-testnet.stellar.org')
  keypair = Keypair.fromSecret(
    payerIsFoo 
    ? foo
    : bar
  )
  const keypair2 = Keypair.fromSecret(
    payerIsFoo 
    ? bar
    : foo
  )
  const publicKey = keypair.publicKey()
  const publicKey2 = keypair2.publicKey()
  const [
    account, 
    account2
  ] = await Promise.all([
    server
    .loadAccount(publicKey)
    .catch(() => 
      server
      .friendbot(publicKey)
      .call()
    )
    .finally(() => 
      server
      .loadAccount(publicKey)
    ),

    server
    .loadAccount(publicKey2)
    .catch(() => 
      server
      .friendbot(publicKey2)
      .call()
    )
    .finally(() => 
      server
      .loadAccount(publicKey2)
    )
  ])

  sourceAccount = payerIsFoo ? account : account2

  await generateOpenChannelTx({
    sourceAccount,
    publicKey1: publicKey,
    publicKey2: publicKey2,
    keypair1: keypair,
    keypair2: keypair2,
  })

  await getIceIceBaby()
  await setupSocket()

  let pps = 0

  interval = setInterval(() => {
    paymentsPerSecond = countReceived - pps
    pps = countReceived
  }, 1000)

  function getIceIceBaby() {
    return fetch('/iceicebaby', {
      method: 'POST'
    })
    .then(async (res) => {
      if (res.ok)
        return res.json()
      else
        throw await res.json()
    })
    .then((res) => iceServers = res)
    .catch((err) => console.error(err))
  }
  function setupSocket() {
    const protocol = location.protocol.indexOf('s') === -1 ? 'ws' : 'wss'
    const hostname = location.hostname === 'localhost' ? `${location.hostname}:3030` : `${location.hostname}`

    socket = new WebSocket(`${protocol}://${hostname}/connect/${payerId}/ws`)

    socket.onopen = async (event) => {
      console.log('socket open', event)
      socket.send(payeeIdArr) // ping payee
    }
    socket.onclose = async (event) => {
      console.log('socket close', event)
    }
    socket.onerror = async (err) => {
      console.error('socket error', err)
    }
    socket.onmessage = async (event) => {
      if (!(event.data instanceof Blob)) {
        console.error(event)
        event.target.close()
        return
      }

      const data = new Uint8Array(await event.data.arrayBuffer())

      if (
        !data.length 
        && !peer
      ) {
        setupPeer()
        socket.send(payeeIdArr) // pong payee
      }

      else if (data.length)
        peer.signal(JSON.parse(decoder.decode(data)))
    }
  }
  function setupPeer() {
    peer = new SimplePeer({
      initiator: payerIsFoo,
      config: { 
        iceTransportPolicy: 'all',
        iceServers: [
          ...iceServers.filter(({url}) => url.indexOf('tcp') > -1),
          {
            urls: 'turn:3.88.162.215:3478?transport=tcp',
            username: 'user',
            credential: 'root',
          }
        ]
      },
    })

    peer.on('connect', () => {
      console.log('peer connected')

      if (peer.initiator)
        update()
    })

    peer.on('close', () => {
      console.log('peer closed')
    })

    peer.on('error', (err) => {
      console.error('peer error', err)
    })

    peer.on('signal', (data) => {
      console.log('peer signal', data)

      const dataArr = encoder.encode(JSON.stringify(data))
      const uint8 = new Uint8Array(payeeIdLen + dataArr.length)

      uint8.set(payeeIdArr, 0)
      uint8.set(dataArr, payeeIdLen)

      socket.send(uint8)
    })

    peer.on('data', (data) => {
      countReceived++
      update()

      const payment = JSON.parse(decoder.decode(data))
      const txDeclarationTransaction = new Transaction(payment.txDeclaration, Networks.TESTNET)
      const txCloseTransaction = new Transaction(payment.txClose, Networks.TESTNET)

      payments.splice(0, 0, {
        txDeclarationSequence: txDeclarationTransaction.sequence,
        txCloseSequence: txCloseTransaction.sequence,
        txDeclaration_submitted: false,
        txClose_submitted: false,
        loading: false,
        ...payment
      })

      payments = payments
    })
  }
  async function update() {
    if (countSent >= totalPayments)
      return

    let payment = await generatePaymentChannelTx({
      sourceAccount,
      publicKey1: publicKey,
      publicKey2: publicKey2,
      keypair1: keypair,
      keypair2: keypair2,
      sequence: countSent + countReceived
    })

    const uint8 = encoder.encode(JSON.stringify(payment))

    peer.write(uint8)
    countSent++
  }

  return () => {
    clearInterval(interval)

    if (socket) {
      socket.close()
      socket = null
    }

    if (peer) {
      peer.destroy()
      peer = null
    }
  }
})

async function txDeclaration(payment) {
  const { Networks, Transaction } = await import('stellar-sdk')
  const { txClose, txDeclaration } = payment
  const txCloseTransaction = new Transaction(txClose, Networks.TESTNET)
  const txDeclarationTransaction = new Transaction(txDeclaration, Networks.TESTNET)

  txDeclarationTransaction.sign(keypair)
  txDeclarationTransaction.signatures.push(keypair.signPayloadDecorated(txCloseTransaction.hash()))

  payment.loading = true
  payments = payments

  return server.submitTransaction(txDeclarationTransaction)
  .then(() => payment.txDeclaration_submitted = true)
  .catch(alertError)
  .finally(() => {
    payment.loading = false
    payments = payments
  })
}
async function txClose(payment) {
  const { Networks, Transaction } = await import('stellar-sdk')
  const { txClose } = payment
  const transaction = new Transaction(txClose, Networks.TESTNET)

  transaction.sign(keypair)

  payment.loading = true
  payments = payments

  return server.submitTransaction(transaction)
  .then(() => payment.txClose_submitted = true)
  .catch(alertError)
  .finally(() => {
    payment.loading = false
    payments = payments
  })
}
function alertError(err) {
  return alert(
    err?.response?.data 
    ? JSON.stringify(err.response.data, null, 2) 
    : err?.message || err
  )
}
</script>

<span>{keypair?.publicKey()}</span>
  
<p>{countSent} payments sent</p>
<p>{countReceived} payments received</p>
<p>{paymentsPerSecond} payments per second</p>

<ul class="flex flex-col justify-start">
  {#each payments as payment}
    <li>
      {#if payment.txDeclaration_submitted && payment.txClose_submitted}
        <span class="button">Payment Channel Closed</span>
      {:else if payment.txDeclaration_submitted}
        <button on:click={txClose(payment)}>{payment.loading ? '...' : `Submit (${payment.txCloseSequence}) txClose`}</button>
      {:else}
        <button on:click={txDeclaration(payment)}>{payment.loading ? '...' : `Submit (${payment.txDeclarationSequence}) txDeclaration`}</button>
      {/if}
    </li>
  {/each}
</ul>

<style>
#app {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin-top: 50px;
  display: flex;
  flex-direction: column;
  font-size: 16px;
  font-weight: normal;
  align-items: center;
}
ul {
  max-height: 500px;
  overflow: scroll;
}
span:not(.button) {
  margin-bottom: 5px;
  font-size: 12px;
  max-width: 500px;
  width: 100%;
}
p {
  margin-bottom: 5px;
  max-width: 500px;
  width: 100%;
}
form {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  max-width: 500px;
  width: 100%;
  font-size: 10px;
}
textarea {
  border: 1px solid black;
  overflow-wrap: break-word;
  word-break: break-all;
  width: 100%;
  height: 100px;
}
button,
.button {
  background-color: black;
  color: white;
  margin-top: 5px;
  padding: 0 5px;
  height: 30px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}
span.button {
  background-color: red;
}
pre {
  margin-top: 5px;
  max-width: 500px;
  overflow-wrap: break-word;
  word-break: break-all;
  font-size: 10px;
}
</style>
