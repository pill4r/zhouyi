import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import hexagramsData from '../data/hexagrams.json'
import { bagua } from '../data/bagua'

export default function HomePage({ userData }) {
  const navigate = useNavigate()
  const [todayHexagram, setTodayHexagram] = useState(null)

  useEffect(() => {
    // 随机选择一个卦作为今日卦
    const randomIndex = Math.floor(Math.random() * 64)
    setTodayHexagram(hexagramsData[randomIndex])
  }, [])

  const learnedCount = userData.learned?.length || 0
  const memorizedCount = userData.memorized?.length || 0
  const favoritesCount = userData.favorites?.length || 0

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <h1 className="text-xl font-semibold text-gold">周易</h1>
      </header>

      <main className="p-5 pb-8">
        {/* 今日卦 */}
        {todayHexagram && (
          <div
            onClick={() => navigate(`/hexagrams/${todayHexagram.id}`)}
            className="bg-gradient-to-br from-card to-surface border border-gold/30 rounded-2xl p-5 mb-6 cursor-pointer active:scale-98 transition-transform"
          >
            <div className="flex items-center gap-4 mb-3">
              <div className="text-4xl">
                {todayHexagram.trigramAbove}{todayHexagram.trigramBelow}
              </div>
              <div>
                <div className="text-gold font-medium">{todayHexagram.nameCn}</div>
                <div className="text-gray text-sm">{todayHexagram.name}</div>
              </div>
            </div>
            <p className="text-text/80 text-sm mb-3">{todayHexagram.judgment}</p>
            <div className="text-xs text-gold-light">今日卦 · 点击查看详情</div>
          </div>
        )}

        {/* 学习进度 */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard label="已学" value={learnedCount} total={64} />
          <StatCard label="已背" value={memorizedCount} total={64} />
          <StatCard label="收藏" value={favoritesCount} total={64} />
        </div>

        {/* 八卦 */}
        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray mb-3">八卦</h2>
          <div className="flex gap-3 overflow-x-auto pb-3 -mx-5 px-5">
            {bagua.map((bag) => (
              <div key={bag.id} className="flex-shrink-0 bg-card rounded-xl p-3 text-center min-w-[70px]">
                <div className="text-2xl mb-1">{bag.symbol}</div>
                <div className="text-sm font-medium">{bag.name}</div>
                <div className="text-xs text-gray">{bag.meaning}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 六十四卦预览 */}
        <section>
          <h2 className="text-sm font-medium text-gray mb-3">六十四卦</h2>
          <div className="grid grid-cols-8 gap-1">
            {hexagramsData.slice(0, 64).map((hex) => (
              <div
                key={hex.id}
                onClick={() => navigate(`/hexagrams/${hex.id}`)}
                className="aspect-square bg-card rounded-lg flex flex-col items-center justify-center cursor-pointer hover:bg-gold/20 transition-colors"
              >
                <div className="text-base leading-tight">{hex.trigramAbove}{hex.trigramBelow}</div>
                <div className="text-xs text-gold/80 leading-none mt-0.5">{hex.name}</div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}

function StatCard({ label, value, total }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  
  return (
    <div className="bg-card rounded-xl p-3 text-center">
      <div className="text-xl font-semibold text-gold">{value}</div>
      <div className="text-xs text-gray">{label}</div>
      <div className="w-full h-1 bg-surface rounded-full mt-2 overflow-hidden">
        <div
          className="h-full bg-gold transition-all"
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
