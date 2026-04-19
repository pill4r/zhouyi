import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import hexagramsData from '../data/hexagrams.json'
import { bagua } from '../data/bagua'

export default function HexagramsPage({ userData, onUpdate }) {
  const navigate = useNavigate()
  const [view, setView] = useState('grid') // 'grid' | 'list'
  const [selectedHexagram, setSelectedHexagram] = useState(null)
  const [filter, setFilter] = useState('all') // 'all' | 'learned' | 'memorized' | 'favorite'

  const learned = userData.learned || []
  const memorized = userData.memorized || []
  const favorites = userData.favorites || []

  const filteredHexagrams = hexagramsData.filter(hex => {
    if (filter === 'learned') return learned.includes(hex.id)
    if (filter === 'memorized') return memorized.includes(hex.id)
    if (filter === 'favorite') return favorites.includes(hex.id)
    return true
  })

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <h1 className="text-xl font-semibold text-gold mb-3">六十四卦</h1>
        
        {/* Filter tabs */}
        <div className="flex gap-2">
          {[
            { key: 'all', label: '全部' },
            { key: 'learned', label: '已学' },
            { key: 'memorized', label: '已背' },
            { key: 'favorite', label: '收藏' },
          ].map(tab => (
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

      <main className="p-5 pb-8">
        {/* Hexagram Grid */}
        <div className="grid grid-cols-4 gap-2">
          {filteredHexagrams.map((hex) => {
            const isLearned = learned.includes(hex.id)
            const isMemorized = memorized.includes(hex.id)
            const isFavorite = favorites.includes(hex.id)
            
            return (
              <div
                key={hex.id}
                onClick={() => navigate(`/hexagrams/${hex.id}`)}
                className={`aspect-square bg-card rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all active:scale-95 ${
                  isLearned ? 'ring-1 ring-gold/50' : ''
                } ${isMemorized ? 'bg-gold/20' : ''}`}
              >
                <div className="text-lg mb-0.5">
                  {hex.trigramAbove}{hex.trigramBelow}
                </div>
                <div className="text-xs text-gold font-medium">{hex.name}</div>
                {isFavorite && <span className="text-xs mt-0.5">★</span>}
              </div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
