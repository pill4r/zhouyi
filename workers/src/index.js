/**
 * 周易学习 App - Cloudflare Workers API
 * 支持：学习进度、收藏、占卜历史、笔记
 * 前端已部署在 Vercel: https://zhouyi-zeta.vercel.app
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

      // 非 API 路径 → 告知前端地址
      return new Response(JSON.stringify({
        error: 'API only',
        message: 'This Worker only serves API endpoints. Frontend is at https://zhouyi-zeta.vercel.app',
        endpoints: ['/api/progress', '/api/favorites', '/api/history', '/api/notes']
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

// 获取用户ID（简化版：使用固定ID或query param）
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
