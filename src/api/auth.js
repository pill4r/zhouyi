const API_BASE = 'https://zhouyi-api.pillarbialexi.workers.dev'

const TOKEN_KEY = 'zhouyi_auth_token'
const USER_KEY = 'zhouyi_auth_user'

export function getStoredAuth() {
  const token = localStorage.getItem(TOKEN_KEY)
  const user = JSON.parse(localStorage.getItem(USER_KEY) || 'null')
  return { token, user }
}

export function storeAuth(token, user) {
  localStorage.setItem(TOKEN_KEY, token)
  localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function clearAuth() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(USER_KEY)
}

export function getAnonymousUserId() {
  return localStorage.getItem('zhouyi_user_id') || null
}

export async function register(username, password) {
  const anonymousUserId = getAnonymousUserId()
  const res = await fetch(`${API_BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, anonymousUserId }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '注册失败')
  storeAuth(data.token, { username: data.username, userId: data.userId })
  return data
}

export async function login(username, password) {
  const res = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || '登录失败')
  storeAuth(data.token, { username: data.username, userId: data.userId })
  return data
}
