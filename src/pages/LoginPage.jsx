import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, register } from '../api/auth'
import { useAuth } from '../components/AuthProvider'
import { LogIn, UserPlus } from 'lucide-react'

export default function LoginPage() {
  const [mode, setMode] = useState('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { onLogin } = useAuth()
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (username.length < 2 || username.length > 20) {
      setError('用户名需2-20个字符')
      return
    }
    if (password.length < 6) {
      setError('密码至少6个字符')
      return
    }
    setLoading(true)
    try {
      const data = mode === 'login'
        ? await login(username, password)
        : await register(username, password)
      onLogin(data.token, { username: data.username, userId: data.userId })
      navigate('/')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary flex flex-col">
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <h1 className="text-xl font-semibold text-gold">{mode === 'login' ? '登录' : '注册'}</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-5">
        <div className="text-5xl mb-6">☰</div>

        {/* Tab 切换 */}
        <div className="flex w-full max-w-sm mb-6 bg-card rounded-xl p-1">
          <button
            onClick={() => { setMode('login'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'login' ? 'bg-gold text-primary' : 'text-muted'
            }`}
          >
            登录
          </button>
          <button
            onClick={() => { setMode('register'); setError('') }}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${
              mode === 'register' ? 'bg-gold text-primary' : 'text-muted'
            }`}
          >
            注册
          </button>
        </div>

        <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <label className="block text-xs text-gray mb-1">用户名</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="2-20个字符，支持中文、字母、数字"
              className="w-full bg-card border border-gold/20 rounded-xl px-4 py-3 text-text placeholder-gray-600 focus:outline-none focus:border-gold/50"
            />
          </div>
          <div>
            <label className="block text-xs text-gray mb-1">密码</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="至少6个字符"
              className="w-full bg-card border border-gold/20 rounded-xl px-4 py-3 text-text placeholder-gray-600 focus:outline-none focus:border-gold/50"
            />
          </div>

          {error && (
            <div className="text-sm text-red-400 text-center">{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gold text-primary font-medium py-3 rounded-full active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none inline-flex items-center justify-center gap-2"
          >
            {mode === 'login' ? <LogIn className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {loading ? '处理中…' : mode === 'login' ? '登录' : '注册'}
          </button>

          {mode === 'register' && (
            <p className="text-xs text-gray-500 text-center">注册后将保留您当前的所有学习数据</p>
          )}
        </form>
      </main>
    </div>
  )
}
