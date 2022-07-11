export async function get() {
  return {
    status: 307,
    headers: {
      Location: '/foo'
    }
  }
}