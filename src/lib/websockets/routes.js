import { parse_route_id } from './routing'

export const routes = [{
  id: '/connect/[id]/ws',
  fn: import('../../routes/connect/[id]/ws')
}].map(({id, fn}) => ({
  id,
  fn,
  ...parse_route_id(id)
}))