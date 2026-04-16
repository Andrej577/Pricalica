function isLocalHost(hostname) {
  return hostname === 'localhost' || hostname === '127.0.0.1'
}

function buildBrowserDefaultUrl() {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  const { hostname, origin, protocol } = window.location

  if (protocol === 'https:' && !isLocalHost(hostname)) {
    return `${origin}/api`
  }

  const normalizedHostname = isLocalHost(hostname) ? 'localhost' : hostname

  return `http://${normalizedHostname}:3000`
}

function normalizeApiBaseUrl(rawUrl) {
  if (!rawUrl || typeof window === 'undefined') {
    return rawUrl
  }

  try {
    const parsedUrl = new URL(rawUrl)
    const { hostname: currentHostname, origin, protocol } = window.location
    const isLocalBrowser = isLocalHost(currentHostname)
    const isLocalApi = isLocalHost(parsedUrl.hostname)
    const isDirectNodePort = parsedUrl.port === '3000'

    if (!isLocalBrowser && isLocalApi) {
      parsedUrl.hostname = currentHostname
    }

    // Production HTTPS must use the reverse-proxied API endpoint to avoid mixed content.
    if (!isLocalBrowser && protocol === 'https:' && isDirectNodePort) {
      return `${origin}/api`
    }

    return parsedUrl.toString().replace(/\/$/, '')
  } catch {
    return rawUrl
  }
}

const configuredApiBaseUrl = normalizeApiBaseUrl(import.meta.env.VITE_API_BASE_URL)

export const API_BASE_URL = configuredApiBaseUrl || buildBrowserDefaultUrl()
