import { getStoredAuth } from './auth'
import { API_BASE } from './config'
import {
  getCachedProgress,
  cacheProgress,
  getCachedFavorites,
  cacheFavorites,
  getCachedNotes,
  cacheNote,
} from './localCache'

function ensureAnonymousId() {
  let id = localStorage.getItem('zhouyi_user_id')
  if (!id) {
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('zhouyi_user_id', id)
  }
  return id
}

function getCurrentUserId() {
  const { user } = getStoredAuth()
  return user?.userId || ensureAnonymousId()
}

function getAuthToken() {
  const { token } = getStoredAuth()
  return token
}

async function apiRequest(endpoint, options = {}) {
  const userId = getCurrentUserId()
  const token = getAuthToken()
  const url = `${API_BASE}${endpoint}?user=${userId}`
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const response = await fetch(url, { ...options, headers })
  if (!response.ok) throw new Error('API request failed')
  return response.json()
}

// 读取：后端优先，失败回退本地缓存
async function getWithFallback(apiCall, cacheGetter) {
  try {
    const data = await apiCall()
    return data
  } catch (e) {
    return cacheGetter()
  }
}

export const API = {
  Progress: {
    get: () => getWithFallback(
      () => apiRequest('/api/progress'),
      () => getCachedProgress()
    ),
    save: async (data) => {
      cacheProgress(data) // 无论后端是否可达，先写本地缓存
      return apiRequest('/api/progress', { method: 'POST', body: JSON.stringify(data) })
    },
  },
  Favorites: {
    get: () => getWithFallback(
      () => apiRequest('/api/favorites'),
      () => getCachedFavorites()
    ),
    add: async (hexagramId) => {
      const next = [...new Set([...getCachedFavorites(), hexagramId])]
      cacheFavorites(next)
      return apiRequest('/api/favorites', { method: 'POST', body: JSON.stringify({ action: 'add', hexagramId }) })
    },
    remove: async (hexagramId) => {
      cacheFavorites(getCachedFavorites().filter(id => id !== hexagramId))
      return apiRequest('/api/favorites', { method: 'POST', body: JSON.stringify({ action: 'remove', hexagramId }) })
    },
  },
  History: {
    get: () => apiRequest('/api/history').catch(() => []),
    add: (record) => apiRequest('/api/history', { method: 'POST', body: JSON.stringify(record) }),
  },
  Notes: {
    get: () => getWithFallback(
      () => apiRequest('/api/notes'),
      () => getCachedNotes()
    ),
    save: async (hexagramId, content) => {
      cacheNote(hexagramId, content) // 先写本地缓存
      try {
        return await apiRequest('/api/notes', { method: 'POST', body: JSON.stringify({ hexagramId, content }) })
      } catch (e) {
        return { success: false, cached: true }
      }
    },
  },
  Health: {
    check: () => apiRequest('/api/health'),
  }
}
