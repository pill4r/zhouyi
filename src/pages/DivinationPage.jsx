import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import hexagramsData from '../data/hexagrams.json'
import { API } from '../api/client'
import { RefreshCw, ChevronRight, Sparkles } from 'lucide-react'

// 三硬币法：字=3 背=2，三币之和
// 6 = 老阴(动) 7 = 少阳 8 = 少阴 9 = 老阳(动)
const LINE_NAMES = ['初', '二', '三', '四', '五', '上']

function getLineName(position, isYang) {
  return LINE_NAMES[position] + (isYang ? '九' : '六')
}

// 从64卦数据构建 "010101" → hexagram 的查找表
function buildLookup() {
  const map = {}
  for (const hex of hexagramsData) {
    const key = hex.lines
      .filter(l => l.position >= 1 && l.position <= 6)
      .map(l => (l.isYang ? '1' : '0'))
      .join('')
    map[key] = hex
  }
  return map
}

const HEXAGRAM_MAP = buildLookup()

function findHexagram(lines) {
  const key = lines.map(l => (l.yang ? '1' : '0')).join('')
  return HEXAGRAM_MAP[key] || null
}

// 产生变卦爻（老阴→阳，老阳→阴）
function getChangedLines(lines) {
  return lines.map(l => {
    if (l.value === 6) return { ...l, yang: true, moving: true }
    if (l.value === 9) return { ...l, yang: false, moving: true }
    return { ...l, moving: false }
  })
}

// 模拟掷三枚铜钱
function throwThreeCoins() {
  const coins = [0, 1, 2].map(() => (Math.random() < 0.5 ? 3 : 2)) // 字=3 背=2
  const sum = coins.reduce((a, b) => a + b, 0)
  let yang, moving
  if (sum === 9) { yang = true; moving = true }   // 老阳 → 动
  else if (sum === 8) { yang = false; moving = false } // 少阴
  else if (sum === 7) { yang = true; moving = false }  // 少阳
  else { yang = false; moving = true }                 // 老阴 → 动 (sum === 6)
  return { coins, sum, yang, moving, value: sum }
}

export default function DivinationPage({ userData, onUpdate }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0=准备, 1=逐爻掷币, 2=结果
  const [currentLine, setCurrentLine] = useState(0) // 当前第几爻 (0-5)
  const [lines, setLines] = useState([])
  const [throwing, setThrowing] = useState(false)
  const [lastThrow, setLastThrow] = useState(null)
  const [saving, setSaving] = useState(false)

  const movingCount = useMemo(() => lines.filter(l => l.moving).length, [lines])

  const changedLines = useMemo(() => {
    if (lines.length < 6) return null
    return getChangedLines(lines)
  }, [lines])

  const originalHex = useMemo(() => {
    if (lines.length < 6) return null
    return findHexagram(lines)
  }, [lines])

  const changedHex = useMemo(() => {
    if (!changedLines || movingCount === 0) return null
    return findHexagram(changedLines)
  }, [changedLines, movingCount])

  const saveHistory = useCallback(async (orig, changed, lineData) => {
    try {
      setSaving(true)
      await API.History.add({
        hexagramId: orig.id,
        name: orig.name,
        nameCn: orig.nameCn,
        trigramAbove: orig.trigramAbove,
        trigramBelow: orig.trigramBelow,
        judgment: orig.judgment,
        movingLines: lineData.filter(l => l.moving).map(l => l.position),
        changedHexagramId: changed?.id || null,
        changedName: changed?.name || null,
        timestamp: Date.now(),
      })
      onUpdate?.()
    } catch {
      // silently fail
    } finally {
      setSaving(false)
    }
  }, [onUpdate])

  async function throwOnce() {
    setThrowing(true)
    setLastThrow(null)

    await new Promise(r => setTimeout(r, 400))

    const result = throwThreeCoins()
    setLastThrow(result)

    await new Promise(r => setTimeout(r, 300))

    const newLines = [...lines, { ...result, position: currentLine }]
    setLines(newLines)
    setThrowing(false)

    if (currentLine < 5) {
      setCurrentLine(currentLine + 1)
    } else {
      // 第六爻完成，计算结果
      const orig = findHexagram(newLines)
      const changed = movingCount > 0 || newLines.some(l => l.moving)
        ? findHexagram(getChangedLines(newLines))
        : null
      if (orig) saveHistory(orig, changed, newLines)
      setStep(2)
    }
  }

  function reset() {
    setStep(0)
    setCurrentLine(0)
    setLines([])
    setLastThrow(null)
    setThrowing(false)
  }

  // 渲染爻线 — CSS 画线代替文字字符
  function renderLine(yang, moving) {
    const barColor = moving
      ? 'bg-gold-light shadow-[0_0_6px_rgba(245,215,122,0.5)]'
      : yang ? 'bg-gold' : 'bg-gray-500'
    return (
      <div className="relative flex items-center w-28 h-5">
        {yang ? (
          <div className={`w-full h-[5px] rounded-full ${barColor} ${moving ? 'animate-pulse' : ''}`} />
        ) : (
          <div className={`w-full flex justify-between ${moving ? 'animate-pulse' : ''}`}>
            <div className={`w-[48%] h-[5px] rounded-full ${barColor}`} />
            <div className={`w-[48%] h-[5px] rounded-full ${barColor}`} />
          </div>
        )}
        {moving && (
          <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-[10px] text-gold-light leading-none">○</span>
        )}
      </div>
    )
  }

  // 爻类型标签
  function LineTypeBadge({ value }) {
    const styles = {
      9: 'bg-gold-light/15 text-gold-light border-gold-light/30',
      8: 'bg-gray-800 text-gray-400 border-gray-700',
      7: 'bg-gray-800 text-gray-400 border-gray-700',
      6: 'bg-gold-light/15 text-gold-light border-gold-light/30',
    }
    const labels = {
      9: '老阳 → 阴',
      8: '少阴',
      7: '少阳',
      6: '老阴 → 阳',
    }
    return (
      <span className={`text-[11px] px-2 py-0.5 rounded-full border ${styles[value]}`}>
        {labels[value]}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-primary">
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <h1 className="text-xl font-semibold text-gold">占卜</h1>
      </header>

      <main className="p-5 pb-24 flex flex-col items-center">
        {/* 准备阶段 */}
        {step === 0 && (
          <div className="text-center mt-12">
            <div className="text-8xl mb-8 animate-pulse">☰</div>
            <p className="text-gray mb-3 max-w-xs mx-auto leading-relaxed">
              诚心默念所问之事，<br />
              专注意念，然后开始占卜。
            </p>
            <p className="text-gray-500 text-xs mb-8">三硬币法 · 六爻成卦</p>
            <button
              onClick={() => setStep(1)}
              className="bg-gold text-primary font-medium px-8 py-3 rounded-full active:scale-95 transition-transform inline-flex items-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              开始占卜
            </button>
          </div>
        )}

        {/* 掷币阶段 — 逐爻 */}
        {step === 1 && (
          <div className="w-full max-w-sm mt-6">
            <div className="text-center mb-6">
              <div className="text-sm text-gray mb-1">第 {currentLine + 1} 爻 / 共六爻</div>
              <div className="text-gold font-medium">{LINE_NAMES[currentLine]}爻</div>
            </div>

            {/* 进度 */}
            <div className="flex justify-center gap-2 mb-8">
              {[0, 1, 2, 3, 4, 5].map(i => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    i < lines.length
                      ? lines[i].moving ? 'bg-gold-light' : 'bg-gold'
                      : i === currentLine
                        ? 'bg-gold/40 animate-pulse'
                        : 'bg-card'
                  }`}
                />
              ))}
            </div>

            {/* 当前三枚铜钱 */}
            <div className="flex justify-center gap-6 mb-8">
              {(lastThrow ? lastThrow.coins : [0, 0, 0]).map((coin, i) => (
                <div
                  key={i}
                  className={`w-16 h-16 rounded-full border-2 flex items-center justify-center text-2xl transition-all duration-300 ${
                    throwing
                      ? 'border-gold/30 animate-bounce'
                      : lastThrow
                        ? coin === 3
                          ? 'border-gold bg-gold/10 text-gold'
                          : 'border-gray-600 bg-card text-gray-400'
                        : 'border-gold/20 bg-card text-gray-600'
                  }`}
                >
                  {lastThrow && !throwing ? (coin === 3 ? '字' : '背') : '…'}
                </div>
              ))}
            </div>

            {lastThrow && !throwing && (
              <div className="text-center mb-6">
                <LineTypeBadge value={lastThrow.sum} />
                <div className="text-xs text-gray-500 mt-1">
                  {lastThrow.sum === 9 && '三字'}
                  {lastThrow.sum === 8 && '二字一背'}
                  {lastThrow.sum === 7 && '一字二背'}
                  {lastThrow.sum === 6 && '三背'}
                </div>
              </div>
            )}

            {/* 已成爻线展示（从下往上） */}
            {lines.length > 0 && (
              <div className="flex flex-col-reverse items-center gap-2 mb-8 bg-card rounded-xl p-4">
                {lines.map((l, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray w-8">{LINE_NAMES[i]}爻</span>
                    {renderLine(l.yang, l.moving)}
                  </div>
                ))}
              </div>
            )}

            <button
              onClick={throwOnce}
              disabled={throwing}
              className="w-full bg-gold text-primary font-medium py-3 rounded-full active:scale-95 transition-transform disabled:opacity-50 disabled:pointer-events-none"
            >
              {throwing ? '掷币中…' : `掷第 ${currentLine + 1} 爻`}
            </button>
          </div>
        )}

        {/* 结果阶段 */}
        {step === 2 && originalHex && (
          <div className="w-full max-w-sm mt-4">
            {/* 本卦 */}
            <div className="bg-card rounded-2xl p-5 mb-4">
              <div className="text-xs text-gray mb-2">本卦</div>
              <div
                className="flex items-center gap-4 cursor-pointer active:scale-98 transition-transform"
                onClick={() => navigate(`/hexagrams/${originalHex.id}`)}
              >
                <div className="text-5xl">{originalHex.trigramAbove}{originalHex.trigramBelow}</div>
                <div className="flex-1">
                  <div className="text-xl font-medium text-gold">{originalHex.name}</div>
                  <div className="text-xs text-gray mt-1 line-clamp-2">{originalHex.judgment}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </div>
            </div>

            {/* 六爻 */}
            <div className="bg-card rounded-2xl p-4 mb-4">
              <div className="text-xs text-gray mb-3">六爻（从下至上）</div>
              <div className="space-y-2">
                {lines.map((l, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-xs text-gray w-10">{getLineName(i, l.yang)}</span>
                    {renderLine(l.yang, l.moving)}
                    <span className="flex-1 text-right">
                      <LineTypeBadge value={l.value} />
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 动爻爻辞 */}
            {lines.some(l => l.moving) && originalHex.lines && (
              <div className="bg-card rounded-2xl p-4 mb-4">
                <div className="text-xs text-gray mb-3">动爻爻辞</div>
                <div className="space-y-3">
                  {lines.map((l, i) =>
                    l.moving ? (
                      <div key={i} className="bg-surface rounded-lg p-3">
                        <div className="text-sm text-gold font-medium mb-1">
                          {originalHex.lines[i]?.name}
                        </div>
                        <div className="text-sm text-text/80">
                          {originalHex.lines[i]?.judgement}
                        </div>
                      </div>
                    ) : null
                  )}
                </div>
              </div>
            )}

            {/* 变卦 */}
            {changedHex && (
              <div className="bg-card rounded-2xl p-5 mb-4">
                <div className="text-xs text-gray mb-2">变卦</div>
                <div
                  className="flex items-center gap-4 cursor-pointer active:scale-98 transition-transform"
                  onClick={() => navigate(`/hexagrams/${changedHex.id}`)}
                >
                  <div className="text-5xl">{changedHex.trigramAbove}{changedHex.trigramBelow}</div>
                  <div className="flex-1">
                    <div className="text-xl font-medium text-gold">{changedHex.name}</div>
                    <div className="text-xs text-gray mt-1 line-clamp-2">{changedHex.judgment}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-500" />
                </div>
              </div>
            )}

            {/* 无动爻提示 */}
            {!lines.some(l => l.moving) && (
              <div className="bg-card rounded-2xl p-4 mb-4 text-center">
                <div className="text-sm text-gray">六爻皆静，以本卦卦辞断之。</div>
              </div>
            )}

            {/* 重新占卜 */}
            <button
              onClick={reset}
              className="w-full text-gold border border-gold/50 py-3 rounded-full active:scale-95 transition-transform inline-flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />重新占卜
            </button>

            {saving && <div className="text-xs text-gray text-center mt-2">保存记录中…</div>}
          </div>
        )}
      </main>
    </div>
  )
}
