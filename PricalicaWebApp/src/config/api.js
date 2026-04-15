function buildBrowserDefaultUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  const { protocol, hostname } = window.location
  const normalizedHostname =
    hostname === 'localhost' || hostname === '127.0.0.1' ? 'localhost' : hostname

  return `${protocol}//${normalizedHostname}:3000`
}

function normalizeApiBaseUrl(rawUrl) {
  if (!rawUrl || typeof window === 'undefined') {
    return rawUrl
  }

  try {
    const parsedUrl = new URL(rawUrl)
    const currentHostname = window.location.hostname
    const isLocalBrowser =
      currentHostname === 'localhost' || currentHostname === '127.0.0.1'
    const isLocalApi =
      parsedUrl.hostname === 'localhost' || parsedUrl.hostname === '127.0.0.1'

    if (!isLocalBrowser && isLocalApi) {
      parsedUrl.hostname = currentHostname
    }

    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return rawUrl
  }
}

const configuredApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export const API_BASE_URL = configuredApiBaseUrl || buildBrowserDefaultUrl()
