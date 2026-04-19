import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import hexagramsData from '../data/hexagrams.json'
import { bagua } from '../data/bagua'
import { API } from '../api/client'

export default function HexagramDetailPage({ userData, onUpdate }) {
  const { id } = useParams()
  const navigate = useNavigate()
  const [hexagram, setHexagram] = useState(null)
  const [note, setNote] = useState('')
  const [saving, setSaving] = useState(false)

  const numId = parseInt(id)
  const hex = hexagramsData.find(h => h.id === numId)

  const isFavorite = userData.favorites?.includes(numId)
  const isLearned = userData.learned?.includes(numId)
  const isMemorized = userData.memorized?.includes(numId)

  useEffect(() => {
    if (hex) {
      setHexagram(hex)
      // 加载笔记
      API.Notes.get().then(data => {
        if (data && data[numId]) {
          setNote(data[numId])
        }
      }).catch(() => {})
    }
  }, [id])

  async function toggleFavorite() {
    try {
      if (isFavorite) {
        await API.Favorites.remove(numId)
      } else {
        await API.Favorites.add(numId)
      }
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  async function toggleLearned() {
    try {
      const newLearned = isLearned
        ? userData.learned.filter(l => l !== numId)
        : [...(userData.learned || []), numId]
      await API.Progress.save({ learned: newLearned, memorized: userData.memorized || [] })
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  async function toggleMemorized() {
    try {
      const newMemorized = isMemorized
        ? userData.memorized.filter(m => m !== numId)
        : [...(userData.memorized || []), numId]
      await API.Progress.save({ learned: userData.learned || [], memorized: newMemorized })
      onUpdate()
    } catch (e) {
      console.error(e)
    }
  }

  async function saveNote() {
    setSaving(true)
    try {
      await API.Notes.save(numId, note)
    } catch (e) {
      console.error(e)
    } finally {
      setSaving(false)
    }
  }

  if (!hex) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="text-gray">卦象不存在</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-primary pb-8">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="text-2xl">←</button>
        <h1 className="text-xl font-semibold text-gold flex-1">{hex.nameCn}</h1>
        <button onClick={toggleFavorite} className={`text-2xl ${isFavorite ? 'text-gold' : 'text-gray'}`}>
          {isFavorite ? '★' : '☆'}
        </button>
      </header>

      <main className="p-5">
        {/* Main Info Card */}
        <div className="bg-gradient-to-br from-card to-surface border border-gold/30 rounded-2xl p-6 mb-6">
          <div className="text-center mb-4">
            <div className="text-6xl mb-2">{hex.trigramAbove}{hex.trigramBelow}</div>
            <div className="text-2xl font-medium text-gold">{hex.nameCn}</div>
            <div className="text-gray">{hex.name}</div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-surface rounded-lg p-3 text-center">
              <div className="text-xs text-gray mb-1">宫</div>
              <div className="text-gold">{hex.palace}</div>
            </div>
            <div className="bg-surface rounded-lg p-3 text-center">
              <div className="text-xs text-gray mb-1">五行</div>
              <div className="text-gold">{hex.fiveElements}</div>
            </div>
          </div>

          <div className="bg-surface rounded-lg p-3 mb-4">
            <div className="text-xs text-gray mb-1">卦辞</div>
            <div className="text-text">{hex.judgment}</div>
          </div>

          <div className="bg-surface rounded-lg p-3">
            <div className="text-xs text-gray mb-1">卦义</div>
            <div className="text-text">{hex.meaning}</div>
          </div>
        </div>

        {/* Learning Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={toggleLearned}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              isLearned
                ? 'bg-gold/20 text-gold border border-gold/50'
                : 'bg-card text-gray'
            }`}
          >
            {isLearned ? '✓ 已学' : '标记已学'}
          </button>
          <button
            onClick={toggleMemorized}
            className={`flex-1 py-2 rounded-full text-sm font-medium transition-colors ${
              isMemorized
                ? 'bg-gold text-primary'
                : 'bg-card text-gray'
            }`}
          >
            {isMemorized ? '✓ 已背' : '标记已背'}
          </button>
        </div>

        {/* Notes */}
        <section className="mb-6">
          <h3 className="text-sm font-medium text-gray mb-2">笔记</h3>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            onBlur={saveNote}
            placeholder="写下你的学习心得..."
            className="w-full bg-card rounded-xl p-3 text-sm resize-none h-24 focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
          {saving && <div className="text-xs text-gray mt-1">保存中...</div>}
        </section>

        {/* Six Lines */}
        <section>
          <h3 className="text-sm font-medium text-gray mb-2">六爻</h3>
          <div className="space-y-2">
            {hex.lines?.map((line) => (
              <div key={line.position} className="bg-card rounded-xl p-3 flex items-center gap-3">
                <div className={`text-2xl ${line.isYang ? 'text-gold' : 'text-gray'}`}>
                  {line.isYang ? '——' : '— —'}
                </div>
                <div>
                  <div className="text-sm font-medium">{line.name}</div>
                  <div className="text-xs text-gray">{line.judgement}</div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  )
}
