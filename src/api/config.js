// 统一的 API 基础地址
// 优先读 Vite 环境变量 VITE_API_BASE（本地联调 wrangler dev 时用），
// 否则回退到生产 Worker 域名。
// .env.development 里可配 VITE_API_BASE=http://localhost:8787
export const API_BASE =
  import.meta.env.VITE_API_BASE || 'https://zhouyi-api.pillarbialexi.workers.dev'
