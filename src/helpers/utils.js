const encoder = new TextEncoder()
const decoder = new TextDecoder()

export async function handleResponse(response) {
  const isResponseJson = response.headers.get('content-type')?.indexOf('json') > -1

  if (response.ok)
    return isResponseJson
    ? response.json() 
    : response.text()

  throw isResponseJson
  ? {
    ...await response.json(),
    status: response.status
  }
  : await response.text()
}

export function shajs(data) {
  return crypto.subtle.digest(
    {name: 'SHA-256'},
    encoder.encode(data)
  )
}

export function alertError(err) {
  return alert(
    err?.response?.data 
    ? JSON.stringify(err.response.data, null, 2) 
    : err?.message || err
  )
}

export function abrv(key, length = 5) {
  if (key)
    return `${key.substring(0, length)}...${key.substring(key.length - length)}`
}