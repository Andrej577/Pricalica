import { defineBoot } from '#q-app/wrappers'
import axios from 'axios'
import { API_BASE_URL } from 'src/config/api'

const api = axios.create({
  baseURL: API_BASE_URL
})

export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios
  app.config.globalProperties.$api = api
})

export { api }
