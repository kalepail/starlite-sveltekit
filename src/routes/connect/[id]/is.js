export async function get({ url, platform }) {
  const { env } = platform
  const { SOCKETS } = env

  const sockId = SOCKETS.idFromName('sockets')
  const sockStub = SOCKETS.get(sockId)
  const sockRes = await sockStub.fetch(url)

  return new Response(null, sockRes)
}