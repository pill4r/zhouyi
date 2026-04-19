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
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理 OPTIONS 预检
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    try {
      // 路由分发
      if (path.startsWith('/api/progress')) {
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

// ============ 学习进度 ============
function getUserId(url) {
  return url.searchParams.get('user') || 'default_user';
}

// ============ 学习进度 ============
async function handleProgress(request, env, url) {
  const userId = getUserId(url);
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
  const userId = getUserId(url);
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
  const userId = getUserId(url);
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
  const userId = getUserId(url);
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
