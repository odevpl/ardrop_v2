import { apiGet } from './api'

export const getConfig = () =>
  apiGet({
    url: 'config',
  })

export default {
  getConfig,
}
