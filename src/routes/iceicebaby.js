export async function post({ platform }) {
  const { env } = platform
  const { ICEICEBABY, TWILIO_SID, TWILIO_TOKEN } = env
  const token = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64')

  let ice_servers = await ICEICEBABY.get('ICEICEBABY', { 
    cacheTtl: 3600,
    type: 'json'
  })

  if (!ice_servers) {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Tokens.json`, {
      cf: {
        cacheTtlByStatus: { 
          '200-299': 60
        },
        cacheEverything: true,
      },
      method: 'POST',
      headers: {
        Authorization: `Basic ${token}`
      }
    })
    .then(async (res) => {
      if (res.ok)
        return res.json()
      else
        throw await res.json()
    })

    ice_servers = res.ice_servers

    await ICEICEBABY.put('ICEICEBABY', JSON.stringify(ice_servers), { expirationTtl: res.ttl })
  }

  return {
    headers: {
      'Access-Control-Allow-Origin': '*'
    },
    body: ice_servers
  }
}