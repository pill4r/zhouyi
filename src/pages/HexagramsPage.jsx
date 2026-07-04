import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import hexagramsData from '../data/hexagrams.json'
import { Star, Search, X } from 'lucide-react'

const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'learned', label: '已学' },
  { key: 'memorized', label: '已背' },
  { key: 'favorite', label: '收藏' },
]

export default function HexagramsPage({ userData, onUpdate }) {
  const navigate = useNavigate()
  const [filter, setFilter] = useState('all') // 'all' | 'learned' | 'memorized' | 'favorite'
  const [query, setQuery] = useState('')

  const learned = userData.learned || []
  const memorized = userData.memorized || []
  const favorites = userData.favorites || []

  // 筛选：分类 + 关键字（卦名/卦辞/卦义）
  const filteredHexagrams = hexagramsData.filter(hex => {
    if (filter === 'learned' && !learned.includes(hex.id)) return false
    if (filter === 'memorized' && !memorized.includes(hex.id)) return false
    if (filter === 'favorite' && !favorites.includes(hex.id)) return false
    if (query.trim()) {
      const q = query.trim().toLowerCase()
      const haystack = `${hex.name} ${hex.nameCn} ${hex.judgment || ''} ${hex.meaning || ''}`.toLowerCase()
      if (!haystack.includes(q)) return false
    }
    return true
  })

  // 空状态文案
  const emptyText = query.trim()
    ? `没有找到与「${query.trim()}」相关的卦`
    : { all: '', learned: '还没有已学的卦象', memorized: '还没有已背的卦象', favorite: '还没有收藏的卦象' }[filter]

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-xl font-semibold text-gold">六十四卦</h1>
          <button
            onClick={() => navigate('/')}
            className="text-xs text-gray hover:text-gold transition-colors px-2 py-1"
          >
            今日卦 →
          </button>
        </div>

        {/* 搜索框 */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜索卦名 / 卦辞 / 卦义"
            className="w-full bg-card border border-gold/20 rounded-full pl-9 pr-9 py-2 text-sm text-text focus:outline-none focus:border-gold/60 placeholder:text-gray-500"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray hover:text-text"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                filter === tab.key
                  ? 'bg-gold text-primary'
                  : 'bg-card text-gray'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </header>

      <main className="p-5 pb-24">
        {/* Hexagram Grid */}
        <div className="grid grid-cols-4 gap-3 md:grid-cols-8 md:gap-2">
          {filteredHexagrams.map((hex) => {
            const isLearned = learned.includes(hex.id)
            const isMemorized = memorized.includes(hex.id)
            const isFavorite = favorites.includes(hex.id)

            return (
              <div
                key={hex.id}
                onClick={() => navigate(`/hexagrams/${hex.id}`)}
                className={`bg-card rounded-xl p-3 md:p-2 text-center cursor-pointer transition-all active:scale-95 ${
                  isLearned ? 'ring-1 ring-gold/50' : ''
                } ${isMemorized ? 'bg-gold/20' : ''}`}
              >
                <div className="text-2xl md:text-xl mb-1 md:mb-0.5">{hex.trigramAbove}{hex.trigramBelow}</div>
                <div className="text-sm md:text-xs text-gold font-medium">{hex.name}</div>
                {isFavorite && <Star className="w-3 h-3 text-gold mx-auto mt-1" fill="currentColor" />}
              </div>
            )
          })}
        </div>

        {/* 空状态 */}
        {filteredHexagrams.length === 0 && (
          <div className="text-center text-gray py-16">
            <p className="text-4xl mb-3 opacity-50">☵</p>
            <p className="text-sm">{emptyText}</p>
          </div>
        )}
      </main>
    </div>
  )
}
