// localStorage 本地缓存层
// 用途：当后端 API 不可达时（如 workers.dev 被墙、断网），
// 学习进度、收藏、笔记仍能在本地保留并展示，不至于"看起来归零"。
// 仅作兜底，真正数据以后端为准；网络恢复后下次写操作会继续尝试后端。

const KEYS = {
  progress: 'zhouyi_progress_cache',
  favorites: 'zhouyi_favorites_cache',
  notes: 'zhouyi_notes_cache',
}

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // localStorage 满或被禁用时静默
  }
}

// ---------- 进度（learned / memorized） ----------
export function getCachedProgress() {
  return read(KEYS.progress, { learned: [], memorized: [] })
}

export function cacheProgress(data) {
  write(KEYS.progress, data)
}

// ---------- 收藏 ----------
export function getCachedFavorites() {
  return read(KEYS.favorites, [])
}

export function cacheFavorites(favorites) {
  write(KEYS.favorites, favorites)
}

// ---------- 笔记（按 hexagramId 索引的对象） ----------
export function getCachedNotes() {
  return read(KEYS.notes, {})
}

export function cacheNote(hexagramId, content) {
  const all = getCachedNotes()
  all[hexagramId] = content
  write(KEYS.notes, all)
}

export function cacheNotesAll(notes) {
  write(KEYS.notes, notes)
}
