import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { API } from '../api/client'
import { useAuth } from '../components/AuthProvider'
import { GraduationCap, Brain, Heart, LogIn, LogOut } from 'lucide-react'

export default function ProfilePage({ userData, onUpdate }) {
  const navigate = useNavigate()
  const { isLoggedIn, user, onLogout } = useAuth()
  const [history, setHistory] = useState([])
  const [notes, setNotes] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [historyData, notesData] = await Promise.all([
        API.History.get(),
        API.Notes.get()
      ])
      setHistory(historyData || [])
      setNotes(notesData || {})
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <h1 className="text-xl font-semibold text-gold">我的</h1>
      </header>

      <main className="p-5 pb-8">
        {/* 认证状态 */}
        {isLoggedIn ? (
          <div className="bg-card rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <div className="text-xs text-gray mb-0.5">当前用户</div>
              <div className="text-gold font-medium">{user?.username}</div>
            </div>
            <button
              onClick={() => { onLogout(); navigate('/') }}
              className="text-gray-400 active:text-gray-200 transition-colors inline-flex items-center gap-1 text-sm"
            >
              <LogOut className="w-4 h-4" />退出
            </button>
          </div>
        ) : (
          <div className="bg-card rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <div className="text-sm text-gray">未登录</div>
              <div className="text-xs text-gray-500">登录后可在多设备同步数据</div>
            </div>
            <button
              onClick={() => navigate('/login')}
              className="bg-gold text-primary font-medium px-4 py-2 rounded-full active:scale-95 transition-transform inline-flex items-center gap-1 text-sm"
            >
              <LogIn className="w-4 h-4" />登录
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-card rounded-xl p-3 text-center">
            <GraduationCap className="w-4 h-4 text-gold mx-auto mb-1" />
            <div className="text-xl font-semibold text-gold">{userData.learned?.length || 0}</div>
            <div className="text-xs text-gray">已学</div>
          </div>
          <div className="bg-card rounded-xl p-3 text-center">
            <Brain className="w-4 h-4 text-gold mx-auto mb-1" />
            <div className="text-xl font-semibold text-gold">{userData.memorized?.length || 0}</div>
            <div className="text-xs text-gray">已背</div>
          </div>
          <div className="bg-card rounded-xl p-3 text-center">
            <Heart className="w-4 h-4 text-gold mx-auto mb-1" />
            <div className="text-xl font-semibold text-gold">{userData.favorites?.length || 0}</div>
            <div className="text-xs text-gray">收藏</div>
          </div>
        </div>

        {/* Recent Divination */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray mb-3">最近占卜</h2>
          {loading ? (
            <div className="text-center text-gray py-4">加载中...</div>
          ) : history.length === 0 ? (
            <div className="bg-card rounded-xl p-4 text-center text-gray text-sm">
              暂无占卜记录
            </div>
          ) : (
            <div className="space-y-2">
              {history.slice(0, 5).map((record) => (
                <div key={record.id} className="bg-card rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{record.trigramAbove}{record.trigramBelow}</div>
                    <div>
                      <div className="text-sm font-medium">{record.name}</div>
                      <div className="text-xs text-gray">{record.question || '未记录问题'}</div>
                    </div>
                  </div>
                  <div className="text-xs text-gray">
                    {new Date(record.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Notes */}
        <section>
          <h2 className="text-sm font-medium text-gray mb-3">我的笔记</h2>
          {Object.keys(notes).length === 0 ? (
            <div className="bg-card rounded-xl p-4 text-center text-gray text-sm">
              暂无笔记
            </div>
          ) : (
            <div className="space-y-2">
              {Object.entries(notes).slice(0, 5).map(([hexagramId, content]) => (
                <div key={hexagramId} className="bg-card rounded-xl p-3">
                  <div className="text-xs text-gold mb-1">卦 #{hexagramId}</div>
                  <div className="text-sm text-text/80">{content}</div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
