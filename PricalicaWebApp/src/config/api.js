function buildBrowserDefaultUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  const { hostname } = window.location
  const normalizedHostname =
    hostname === 'localhost' || hostname === '127.0.0.1' ? 'localhost' : hostname

  return `http://${normalizedHostname}:3000`
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
    const isDirectNodePort = parsedUrl.port === '3000'

    if (!isLocalBrowser && isLocalApi) {
      parsedUrl.hostname = currentHostname
    }

    // Backend on port 3000 is served without TLS; keep proxied /api URLs untouched.
    if (parsedUrl.protocol === 'https:' && isDirectNodePort) {
      parsedUrl.protocol = 'http:'
    }

    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return rawUrl
  }
}

const configuredApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export const API_BASE_URL = configuredApiBaseUrl || buildBrowserDefaultUrl()
