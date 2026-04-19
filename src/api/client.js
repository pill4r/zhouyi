/**
 * 周易学习 App - API 调用层
 * 对接 Cloudflare Workers KV 存储
 */

const API_BASE = 'https://zhouyi-api.pillarbialexi.workers.dev'

// 生成用户ID
function generateUserId() {
  let id = localStorage.getItem('zhouyi_user_id')
  if (!id) {
    id = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
    localStorage.setItem('zhouyi_user_id', id)
  }
  return id
}

const USER = generateUserId()

// 通用请求
async function apiRequest(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}?user=${USER}`
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!response.ok) throw new Error('API request failed')
  return response.json()
}

export const API = {
  Progress: {
    get: () => apiRequest('/api/progress'),
    save: (data) => apiRequest('/api/progress', { method: 'POST', body: JSON.stringify(data) }),
  },
  Favorites: {
    get: () => apiRequest('/api/favorites'),
    add: (hexagramId) => apiRequest('/api/favorites', { method: 'POST', body: JSON.stringify({ action: 'add', hexagramId }) }),
    remove: (hexagramId) => apiRequest('/api/favorites', { method: 'POST', body: JSON.stringify({ action: 'remove', hexagramId }) }),
  },
  History: {
    get: () => apiRequest('/api/history'),
    add: (record) => apiRequest('/api/history', { method: 'POST', body: JSON.stringify(record) }),
  },
  Notes: {
    get: () => apiRequest('/api/notes'),
    save: (hexagramId, content) => apiRequest('/api/notes', { method: 'POST', body: JSON.stringify({ hexagramId, content }) }),
  },
  Health: {
    check: () => apiRequest('/api/health'),
  }
}
