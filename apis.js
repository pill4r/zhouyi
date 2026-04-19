/**
 * 周易学习 App - API 调用层
 * 对接 Cloudflare Workers KV 存储
 */

const API_BASE = 'https://zhouyi-api.pillarbialexi.workers.dev';

// 当前用户ID（简化版，实际应该用登录系统）
const USER_ID = 'user_' + (localStorage.getItem('zhouyi_user_id') || generateUserId());

function generateUserId() {
    const id = 'user_' + Date.now().toString(36);
    localStorage.setItem('zhouyi_user_id', id);
    return id;
}

// ============ API 请求封装 ============
async function apiRequest(endpoint, options = {}) {
    const url = API_BASE + endpoint + (endpoint.includes('?') ? '&' : '?') + 'user=' + encodeURIComponent(USER_ID);
    
    const config = {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
        ...options,
    };
    
    if (options.body) {
        config.body = JSON.stringify(options.body);
    }
    
    try {
        const response = await fetch(url, config);
        return await response.json();
    } catch (err) {
        console.error('API Error:', err);
        return { error: err.message };
    }
}

// ============ 学习进度 ============
const ProgressAPI = {
    async get() {
        return await apiRequest('/api/progress');
    },
    
    async save(data) {
        return await apiRequest('/api/progress', {
            method: 'POST',
            body: data,
        });
    },
    
    async markLearned(hexagramId) {
        const data = await this.get();
        if (!data.learned) data.learned = [];
        if (!data.learned.includes(hexagramId)) {
            data.learned.push(hexagramId);
        }
        return await this.save(data);
    },
    
    async markMemorized(hexagramId) {
        const data = await this.get();
        if (!data.memorized) data.memorized = [];
        if (!data.memorized.includes(hexagramId)) {
            data.memorized.push(hexagramId);
        }
        return await this.save(data);
    },
};

// ============ 收藏夹 ============
const FavoritesAPI = {
    async get() {
        return await apiRequest('/api/favorites');
    },
    
    async add(hexagramId) {
        return await apiRequest('/api/favorites', {
            method: 'POST',
            body: { action: 'add', hexagramId },
        });
    },
    
    async remove(hexagramId) {
        return await apiRequest('/api/favorites', {
            method: 'POST',
            body: { action: 'remove', hexagramId },
        });
    },
    
    async toggle(hexagramId) {
        const favorites = await this.get();
        if (favorites.includes(hexagramId)) {
            return await this.remove(hexagramId);
        } else {
            return await this.add(hexagramId);
        }
    },
};

// ============ 占卜历史 ============
const HistoryAPI = {
    async get() {
        return await apiRequest('/api/history');
    },
    
    async add(hexagramId, changedLines, note = '') {
        return await apiRequest('/api/history', {
            method: 'POST',
            body: { hexagramId, changedLines, note },
        });
    },
};

// ============ 笔记 ============
const NotesAPI = {
    async get() {
        return await apiRequest('/api/notes');
    },
    
    async save(hexagramId, content) {
        return await apiRequest('/api/notes', {
            method: 'POST',
            body: { hexagramId, content },
        });
    },
};

// 导出到全局
window.API = {
    Progress: ProgressAPI,
    Favorites: FavoritesAPI,
    History: HistoryAPI,
    Notes: NotesAPI,
};
