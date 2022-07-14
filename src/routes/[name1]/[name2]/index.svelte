<script>
  import SimplePeer from 'simple-peer/simplepeer.min.js'
  import { onMount } from 'svelte'
  import { dev } from '$app/env'
  import BigNumber from 'bignumber.js'
  import { page } from '$app/stores';
  
  import { alertError, handleResponse, shajs, abrv } from '../../../helpers/utils'
  import { generatePaymentChannelTx, generateOpenChannelTx } from '../../../helpers/payment-channel'
  
  let payerId = null
  let payeeId = null
  let peer = null
  let socket = null
  let payments = []
  let keypair = null
  let publicKey = null
  let sourceAccount = null
  let totalPayments = 250
  let countSent = 0
  let countReceived = 0
  let paymentsPerSecond = 0
  let iceServers = undefined
  let interval = null
  let server = null
  let initiator = false
  
  onMount(async () => {
    localStorage.removeItem('amount')

    const { Keypair, Networks, Server, Transaction } = await import('stellar-sdk')
  
    const encoder = new TextEncoder()
    const decoder = new TextDecoder()
  
    payerId = $page.params.name1
    payeeId = $page.params.name2

    keypair = Keypair.fromRawEd25519Seed(await shajs(dev + payerId))
    const keypair2 = Keypair.fromRawEd25519Seed(await shajs(dev + payeeId))

    server = new Server('https://horizon-testnet.stellar.org')
    
    publicKey = keypair.publicKey()
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
        .then(() => 
          server
          .loadAccount(publicKey)
        )
      ),
  
      server
      .loadAccount(publicKey2)
      .catch(() => 
        server
        .friendbot(publicKey2)
        .call()
        .then(() => 
          server
          .loadAccount(publicKey2)
        )
      ),

      fetch(`/connect/${payeeId}-${payerId}/is`)
      .then(handleResponse)
      .then(() => initiator = false)
      .catch(() => initiator = true)
    ])
  
    sourceAccount = initiator ? account : account2

    try {
      await generateOpenChannelTx({
        sourceAccount,
        publicKey1: publicKey,
        publicKey2: publicKey2,
        keypair1: keypair,
        keypair2: keypair2,
      })
    } catch(err) {
      return alertError(err)
    }
  
    await getIceIceBaby()
    await setupSocket()
  
    let pps = 0
  
    interval = setInterval(() => {
      paymentsPerSecond = countReceived + countSent - pps
      pps = countReceived + countSent
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
      const host = `${location.host.replace(/:\d+/gi, ':3030')}`
  
      socket = new WebSocket(`${protocol}://${host}/connect/${payerId}-${payeeId}/ws`)
  
      socket.onopen = async (event) => {
        console.log('socket open', event)
        socket.send(encoder.encode(JSON.stringify({id: `${payeeId}-${payerId}`}))) // ping payee
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
  
        let data = new Uint8Array(await event.data.arrayBuffer())
            data = JSON.parse(decoder.decode(data))

        if (!peer) {
          setupPeer()
          socket.send(encoder.encode(JSON.stringify({id: `${payeeId}-${payerId}`}))) // pong payee
        }
  
        else if (Object.keys(data).length > 0)
          peer.signal(data)
      }
    }

    function setupPeer() {
      peer = new SimplePeer({
        initiator,
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
  
        data.id = `${payeeId}-${payerId}`
        data = encoder.encode(JSON.stringify(data))
  
        socket.send(data)
      })
  
      peer.on('data', (data) => {
        countReceived++
        update()
  
        const payment = JSON.parse(decoder.decode(data))
        const txDeclarationTransaction = new Transaction(payment.txDeclaration, Networks.TESTNET)
        const txCloseTransaction = new Transaction(payment.txClose, Networks.TESTNET)
        const {amount, source, destination} = txCloseTransaction.operations?.[0]
  
        localStorage.setItem('amount', amount || 0)
  
        payments.splice(0, 0, {
          txDeclarationSequence: txDeclarationTransaction.sequence,
          txCloseSequence: txCloseTransaction.sequence,
          txDeclaration_submitted: false,
          txClose_submitted: false,
          loading: false,
          source,
          amount,
          destination,
          ...payment
        })
  
        payments = payments
      })
    }
    
    async function update() {
      if (countSent >= totalPayments)
        return
  
      const amount = new BigNumber(localStorage.getItem('amount') || 0).plus(Math.random() * 10).toFixed(7)
  
      let payment = await generatePaymentChannelTx({
        sourceAccount,
        publicKey1: publicKey,
        publicKey2: publicKey2,
        keypair1: keypair,
        sequence: countSent + countReceived,
        amount
      })
  
      const uint8 = encoder.encode(JSON.stringify(payment))
  
      peer.write(uint8)
      countSent++
    }
  
    return () => {
      clearInterval(interval)
      localStorage.removeItem('amount')
  
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
  </script>
  
  <span>{payerId} / {payeeId}</span>
  <span><a class="text-blue-500 underline" href="https://stellar.expert/explorer/testnet/account/{publicKey}" target="_blank">{abrv(publicKey, 10)}</a></span>
    
  <p>{countSent} payments sent</p>
  <p>{countReceived} payments received</p>
  <p>{paymentsPerSecond} payments per second</p>
  
  <ul class="flex flex-col justify-start">
    {#each payments as payment}
      <li>
        {#if payment.txDeclaration_submitted && payment.txClose_submitted}
          <span class="button flex flex-col !items-start">
            <p class="!m-0">Payment Channel Closed</p>
          </span>
        {:else if payment.txDeclaration_submitted}
          <button class="flex flex-col !items-start" on:click={txClose(payment)}>
            <p class="!m-0">{payment.loading ? '...' : `Submit txClose`}</p>
            <aside>Sequence: {payment.txCloseSequence}</aside>
            <aside><strong>{payment.amount} XLM</strong> from <strong>{abrv(payment.source)}</strong> to <strong>{abrv(payment.destination)}</strong></aside>
          </button>
        {:else}
          <button class="flex flex-col !items-start" on:click={txDeclaration(payment)}>
            <p class="!m-0">{payment.loading ? '...' : `Submit txDeclaration`}</p>
            <aside>Sequence: {payment.txDeclarationSequence}</aside>
            <aside><strong>{payment.amount} XLM</strong> from <strong>{abrv(payment.source)}</strong> to <strong>{abrv(payment.destination)}</strong></aside>
          </button>
        {/if}
      </li>
    {/each}
  </ul>
  
  <style>
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
    text-align: left;
  }
  button,
  .button {
    background-color: black;
    color: white;
    margin-top: 5px;
    padding: 5px;
    display: inline-flex;
    align-items: center;
    cursor: pointer;
    width: 100%;
  }
  button p,
  .button p {
    font-size: 12px;
    text-transform: uppercase;
    font-weight: bold;
  }
  button aside,
  .button aside {
    font-size: 10px;
  }
  span.button {
    background-color: red;
  }
  </style>
  