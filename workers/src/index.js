/**
 * 周易学习 App - Cloudflare Workers API + 静态文件托管
 * 支持：学习进度、收藏、占卜历史、笔记
 * 静态前端也托管在此 Worker 上
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS 头
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };

    // 处理 OPTIONS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 路由分发
      if (path === '/api/auth/register' && request.method === 'POST') {
        return handleRegister(request, env, corsHeaders);
      } else if (path === '/api/auth/login' && request.method === 'POST') {
        return handleLogin(request, env, corsHeaders);
      } else if (path === '/api/auth/verify' && request.method === 'GET') {
        return handleVerify(request, env, corsHeaders);
      } else if (path.startsWith('/api/progress')) {
        return handleProgress(request, env, url);
      } else if (path.startsWith('/api/favorites')) {
        return handleFavorites(request, env, url);
      } else if (path.startsWith('/api/history')) {
        return handleHistory(request, env, url);
      } else if (path.startsWith('/api/notes')) {
        return handleNotes(request, env, url);
      } else if (path === '/api/health') {
        return new Response(JSON.stringify({ status: 'ok' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // 静态文件服务 (index.html, *.js, *.json, *.css, *.webp)
      const staticExt = ['.html', '.js', '.json', '.css', '.webp', '.png', '.jpg'];
      const isStatic = staticExt.some(ext => path.endsWith(ext)) || path === '/';
      if (isStatic) {
        let filePath = path;
        if (path === '/') filePath = '/index.html';
        
        // 尝试从 KV 获取静态文件
        const staticFile = await env.ZHOUYI_KV.get(`static${filePath}`, 'text');
        if (staticFile) {
          const contentType = getContentType(filePath);
          return new Response(staticFile, {
            headers: { 'Content-Type': contentType, ...corsHeaders },
          });
        }

        // 尝试从 Worker bundle 内读取 (通过 glob import)
        try {
          const asset = staticAssets[`./public${filePath}`];
          if (asset) {
            const contentType = getContentType(filePath);
            return new Response(asset, {
              headers: { 'Content-Type': contentType, ...corsHeaders },
            });
          }
        } catch (e) {}

        // 返回 index.html (SPA fallback)
        const indexHtml = await env.ZHOUYI_KV.get('static/index.html', 'text');
        if (indexHtml) {
          return new Response(indexHtml, {
            headers: { 'Content-Type': 'text/html', ...corsHeaders },
          });
        }
      }

      // 未知路径
      return new Response(JSON.stringify({
        error: 'Not Found',
        message: 'API endpoint or static file not found',
        endpoints: ['/api/progress', '/api/favorites', '/api/history', '/api/notes'],
        static: ['/', '/index.html', '/apis.js', '/hexagrams.json']
      }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  }
};

function getContentType(path) {
  if (path.endsWith('.html')) return 'text/html; charset=utf-8';
  if (path.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.webp')) return 'image/webp';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg')) return 'image/jpeg';
  return 'text/plain';
}

// ============ 用户认证工具 ============

function toBase64Url(buffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

async function hashPassword(password, salt) {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial, 256
  );
  return toBase64Url(derivedBits);
}

async function signJWT(payload, secret) {
  const header = toBase64Url(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })));
  const body = toBase64Url(new TextEncoder().encode(JSON.stringify(payload)));
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  return `${header}.${body}.${toBase64Url(sig)}`;
}

async function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, body, signature] = parts;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(`${header}.${body}`));
  const expected = toBase64Url(sig);
  if (signature !== expected) return null;
  try {
    const payload = JSON.parse(atob(body.replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp < Date.now() / 1000) return null;
    return payload;
  } catch { return null; }
}

async function getAuthenticatedUserId(request, url, env) {
  const authHeader = request.headers.get('Authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const payload = await verifyJWT(authHeader.slice(7), env.JWT_SECRET);
    if (payload && payload.sub) return payload.sub;
  }
  return url.searchParams.get('user') || 'default_user';
}

// ============ 认证路由 ============

async function handleRegister(request, env, corsHeaders) {
  try {
    const { username, password, anonymousUserId } = await request.json();
    if (!username || !password) {
      return jsonResp({ error: '用户名和密码不能为空' }, 400, corsHeaders);
    }
    if (username.length < 2 || username.length > 20) {
      return jsonResp({ error: '用户名需2-20个字符' }, 400, corsHeaders);
    }
    if (!/^[\u4e00-\u9fa5a-zA-Z0-9_]+$/.test(username)) {
      return jsonResp({ error: '用户名仅支持中文、字母、数字、下划线' }, 400, corsHeaders);
    }
    if (password.length < 6) {
      return jsonResp({ error: '密码至少6个字符' }, 400, corsHeaders);
    }

    const existing = await env.ZHOUYI_KV.get(`user:${username}`);
    if (existing) {
      return jsonResp({ error: '该用户名已被注册' }, 409, corsHeaders);
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    const passwordHash = await hashPassword(password, salt);
    const userId = anonymousUserId || 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

    await env.ZHOUYI_KV.put(`user:${username}`, JSON.stringify({
      userId, passwordHash, salt: toBase64Url(salt), createdAt: new Date().toISOString()
    }));

    const token = await signJWT(
      { sub: userId, username, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 },
      env.JWT_SECRET
    );

    return jsonResp({ success: true, token, username, userId }, 200, corsHeaders);
  } catch (err) {
    return jsonResp({ error: err.message }, 500, corsHeaders);
  }
}

async function handleLogin(request, env, corsHeaders) {
  try {
    const { username, password } = await request.json();
    if (!username || !password) {
      return jsonResp({ error: '用户名和密码不能为空' }, 400, corsHeaders);
    }

    const data = await env.ZHOUYI_KV.get(`user:${username}`, 'json');
    if (!data) {
      return jsonResp({ error: '用户名或密码错误' }, 401, corsHeaders);
    }

    const saltBytes = Uint8Array.from(atob(data.salt.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0));
    const hash = await hashPassword(password, saltBytes);
    if (hash !== data.passwordHash) {
      return jsonResp({ error: '用户名或密码错误' }, 401, corsHeaders);
    }

    const token = await signJWT(
      { sub: data.userId, username, exp: Math.floor(Date.now() / 1000) + 30 * 24 * 3600 },
      env.JWT_SECRET
    );

    return jsonResp({ success: true, token, username, userId: data.userId }, 200, corsHeaders);
  } catch (err) {
    return jsonResp({ error: err.message }, 500, corsHeaders);
  }
}

async function handleVerify(request, env, corsHeaders) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return jsonResp({ valid: false }, 401, corsHeaders);
  }
  const payload = await verifyJWT(authHeader.slice(7), env.JWT_SECRET);
  if (!payload) {
    return jsonResp({ valid: false }, 401, corsHeaders);
  }
  return jsonResp({ valid: true, username: payload.username, userId: payload.sub }, 200, corsHeaders);
}

function jsonResp(data, status, corsHeaders) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// ============ 学习进度 ============

// ============ 学习进度 ============
async function handleProgress(request, env, url) {
  const userId = await getAuthenticatedUserId(request, url, env);
  const key = `progress:${userId}`;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (request.method === 'GET') {
    const data = await env.ZHOUYI_KV.get(key, 'json');
    return new Response(JSON.stringify(data || { learned: [], memorized: [] }), {
      headers: corsHeaders,
    });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    await env.ZHOUYI_KV.put(key, JSON.stringify(body));
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  return new Response('Method Not Allowed', { status: 405 });
}

// ============ 收藏夹 ============
async function handleFavorites(request, env, url) {
  const userId = await getAuthenticatedUserId(request, url, env);
  const key = `favorites:${userId}`;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (request.method === 'GET') {
    const data = await env.ZHOUYI_KV.get(key, 'json');
    return new Response(JSON.stringify(data || []), { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const { action, hexagramId } = body;

    let favorites = (await env.ZHOUYI_KV.get(key, 'json')) || [];

    if (action === 'add') {
      if (!favorites.includes(hexagramId)) {
        favorites.push(hexagramId);
      }
    } else if (action === 'remove') {
      favorites = favorites.filter(id => id !== hexagramId);
    }

    await env.ZHOUYI_KV.put(key, JSON.stringify(favorites));
    return new Response(JSON.stringify({ success: true, favorites }), { headers: corsHeaders });
  }

  return new Response('Method Not Allowed', { status: 405 });
}

// ============ 占卜历史 ============
async function handleHistory(request, env, url) {
  const userId = await getAuthenticatedUserId(request, url, env);
  const key = `history:${userId}`;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (request.method === 'GET') {
    const data = await env.ZHOUYI_KV.get(key, 'json');
    return new Response(JSON.stringify(data || []), { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const record = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      ...body,
    };

    let history = (await env.ZHOUYI_KV.get(key, 'json')) || [];
    history.unshift(record);

    // 只保留最近100条
    if (history.length > 100) {
      history = history.slice(0, 100);
    }

    await env.ZHOUYI_KV.put(key, JSON.stringify(history));
    return new Response(JSON.stringify({ success: true, record }), { headers: corsHeaders });
  }

  return new Response('Method Not Allowed', { status: 405 });
}

// ============ 笔记 ============
async function handleNotes(request, env, url) {
  const userId = await getAuthenticatedUserId(request, url, env);
  const key = `notes:${userId}`;
  const corsHeaders = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' };

  if (request.method === 'GET') {
    const data = await env.ZHOUYI_KV.get(key, 'json');
    return new Response(JSON.stringify(data || {}), { headers: corsHeaders });
  }

  if (request.method === 'POST') {
    const body = await request.json();
    const { hexagramId, content } = body;

    let notes = (await env.ZHOUYI_KV.get(key, 'json')) || {};
    notes[hexagramId] = content;

    await env.ZHOUYI_KV.put(key, JSON.stringify(notes));
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders });
  }

  return new Response('Method Not Allowed', { status: 405 });
}
