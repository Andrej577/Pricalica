import { computed, ref } from 'vue'

const STORAGE_KEY = 'pricalica-user-role'
const USER_ID_STORAGE_KEY = 'pricalica-user-id'
const initialRole =
  typeof window !== 'undefined' ? window.localStorage.getItem(STORAGE_KEY) ?? '' : ''
const initialUserId =
  typeof window !== 'undefined' ? window.localStorage.getItem(USER_ID_STORAGE_KEY) ?? '' : ''

const currentUserRole = ref(initialRole)
const currentUserId = ref(initialUserId)

export function useAuthState() {
  const isAdmin = computed(() => currentUserRole.value === 'admin')
  const isAuthenticated = computed(() => Boolean(currentUserRole.value))

  return {
    currentUserRole,
    currentUserId,
    isAdmin,
    isAuthenticated,
  }
}

export function setCurrentUserRole(role) {
  currentUserRole.value = role

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(STORAGE_KEY, role)
  }
}

export function clearCurrentUserRole() {
  currentUserRole.value = ''
  currentUserId.value = ''

  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY)
    window.localStorage.removeItem(USER_ID_STORAGE_KEY)
  }
}

export function getCurrentUserRole() {
  return currentUserRole.value
}

export function setCurrentUserId(userId) {
  currentUserId.value = userId ? String(userId) : ''

  if (typeof window !== 'undefined') {
    if (userId) {
      window.localStorage.setItem(USER_ID_STORAGE_KEY, String(userId))
    } else {
      window.localStorage.removeItem(USER_ID_STORAGE_KEY)
    }
  }
}

export function getCurrentUserId() {
  return currentUserId.value
}

export function isAuthenticated() {
  return Boolean(currentUserRole.value)
}
