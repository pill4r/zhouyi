import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import hexagramsData from '../data/hexagrams.json'
import { API } from '../api/client'
import { RefreshCw, ChevronRight, Sparkles, ArrowRight, BookOpen } from 'lucide-react'

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

// 单枚铜钱组件 — 传统方孔钱 SVG
import AncientCoin from '../components/AncientCoin'

function Coin({ coin, index, throwing, lastThrow, revealed }) {
  const isZi = coin === 3
  const hasResult = lastThrow && !throwing && revealed
  const active = hasResult && isZi

  let animClass = 'coin-idle'
  if (throwing) animClass = `coin-flip-${index}`
  else if (hasResult) animClass = 'coin-reveal'

  let face = 'unknown'
  if (hasResult || throwing) {
    face = isZi ? 'word' : 'back'
  }

  return (
    <div className="flex flex-col items-center gap-1.5" style={{ perspective: '500px' }}>
      <AncientCoin
        face={face}
        animClass={animClass}
        active={active}
      />

      {hasResult && (
        <span className={`text-[10px] font-medium ${active ? 'text-gold' : 'text-gray-500'}`}>
          {isZi ? '字 (3)' : '背 (2)'}
        </span>
      )}
    </div>
  )
}

// 动爻标记：老阳 ○，老阴 ×
function getMarker(value) {
  if (value === 9) return '○'
  if (value === 6) return '×'
  return ''
}

// 爻类型标签
function LineTypeBadge({ value }) {
  const config = {
    9: { label: '老阳', sub: '变阴', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
    7: { label: '少阳', sub: '', cls: 'bg-sky-500/15 text-sky-300 border-sky-500/25' },
    8: { label: '少阴', sub: '', cls: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/25' },
    6: { label: '老阴', sub: '变阳', cls: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  }
  const c = config[value]
  return (
    <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${c.cls}`}>
      <span className="font-medium">{c.label}</span>
      {c.sub && <span className="text-[10px] opacity-70">→ {c.sub}</span>}
    </span>
  )
}

export default function DivinationPage({ userData, onUpdate }) {
  const navigate = useNavigate()
  const [step, setStep] = useState(0) // 0=准备, 1=逐爻掷币, 2=结果
  const [currentLine, setCurrentLine] = useState(0) // 当前第几爻 (0-5)
  const [lines, setLines] = useState([])
  const [throwing, setThrowing] = useState(false)
  const [lastThrow, setLastThrow] = useState(null)
  const [saving, setSaving] = useState(false)
  const [revealed, setRevealed] = useState(false)

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
    setRevealed(false)

    const result = throwThreeCoins()
    setLastThrow(result)

    // Wait for flip animation to finish (~800ms for the longest coin)
    await new Promise(r => setTimeout(r, 850))

    setThrowing(false)
    // Staggered reveal
    await new Promise(r => setTimeout(r, 150))
    setRevealed(true)

    await new Promise(r => setTimeout(r, 400))

    const newLines = [...lines, { ...result, position: currentLine }]
    setLines(newLines)

    if (currentLine < 5) {
      setCurrentLine(currentLine + 1)
    } else {
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
    setRevealed(false)
  }

  // 渲染单条爻线
  function renderLine(yang, moving, value) {
    const marker = value ? getMarker(value) : ''
    const barColor = moving
      ? 'bg-gold-light shadow-[0_0_8px_rgba(245,215,122,0.5)]'
      : yang ? 'bg-gold' : 'bg-muted'
    return (
      <div className="relative flex items-center w-28 h-6">
        {yang ? (
          <div className={`w-full h-[5px] rounded-full ${barColor} ${moving ? 'animate-pulse' : ''}`} />
        ) : (
          <div className={`w-full flex justify-between ${moving ? 'animate-pulse' : ''}`}>
            <div className={`w-[45%] h-[5px] rounded-full ${barColor}`} />
            <div className={`w-[45%] h-[5px] rounded-full ${barColor}`} />
          </div>
        )}
        {marker && (
          <span className="absolute -right-5 top-1/2 -translate-y-1/2 text-xs text-gold-light font-bold leading-none">
            {marker}
          </span>
        )}
      </div>
    )
  }

  // 渲染完整卦象图（无标记版）
  function renderHexagramDiagram(linesData) {
    return (
      <div className="flex flex-col items-center gap-2">
        {[...linesData].reverse().map((l, ri) => {
          const yang = l.yang
          const barColor = yang ? 'bg-gold' : 'bg-muted'
          return (
            <div key={ri} className="flex items-center w-24 h-5">
              {yang ? (
                <div className={`w-full h-[5px] rounded-full ${barColor}`} />
              ) : (
                <div className="w-full flex justify-between">
                  <div className={`w-[44%] h-[5px] rounded-full ${barColor}`} />
                  <div className={`w-[44%] h-[5px] rounded-full ${barColor}`} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    )
  }

  // 解卦步骤组件
  function DivinationGuide({ lines, originalHex, changedHex }) {
    const movingCount = lines.filter(l => l.moving).length
    const staticIndices = lines.map((l, i) => !l.moving ? i : -1).filter(i => i !== -1)

    let stepTitle = ''
    let stepDesc = ''
    let referenceName = ''
    let referenceText = ''
    let trendText = ''

    if (movingCount === 0) {
      stepTitle = '六爻皆静'
      stepDesc = '六个爻都没有动，代表事情相对稳定，以本卦卦辞断之。'
      referenceName = `${originalHex.name} · 卦辞`
      referenceText = originalHex.judgment
      trendText = '当前状态稳定，暂无明显变化趋势。'
    } else if (movingCount === 1) {
      const idx = lines.findIndex(l => l.moving)
      stepTitle = '一爻动'
      stepDesc = `只有一个爻动（${originalHex.lines[idx]?.name}），以本卦此爻爻辞断之。这是最简单、最明确的占法。`
      referenceName = `${originalHex.name} · ${originalHex.lines[idx]?.name}`
      referenceText = originalHex.lines[idx]?.judgement
      trendText = changedHex
        ? `动则生变，趋势指向「${changedHex.name}」。`
        : ''
    } else if (movingCount === 2) {
      const movingIndices = lines.map((l, i) => l.moving ? i : -1).filter(i => i !== -1)
      const l1 = lines[movingIndices[0]]
      const l2 = lines[movingIndices[1]]
      let targetIdx
      if (l1.yang !== l2.yang) {
        targetIdx = l1.yang ? movingIndices[1] : movingIndices[0]
        const targetLine = originalHex.lines[targetIdx]
        stepTitle = '两爻动（一阴一阳）'
        stepDesc = `两个爻动，一阴一阳，取阴爻（${targetLine?.name}）爻辞断之。`
        referenceName = `${originalHex.name} · ${targetLine?.name}`
      } else {
        targetIdx = Math.max(...movingIndices)
        const targetLine = originalHex.lines[targetIdx]
        stepTitle = `两爻动（同为${l1.yang ? '阳' : '阴'}）`
        stepDesc = `两个爻动，同为${l1.yang ? '阳' : '阴'}，取上爻（${targetLine?.name}）爻辞断之。`
        referenceName = `${originalHex.name} · ${targetLine?.name}`
      }
      referenceText = originalHex.lines[targetIdx]?.judgement
      trendText = changedHex
        ? `两爻皆变，趋势指向「${changedHex.name}」。`
        : ''
    } else if (movingCount === 3) {
      stepTitle = '三爻动'
      stepDesc = '三个爻动，变化复杂，以本卦卦辞为主，变卦为辅参看。'
      referenceName = `${originalHex.name} · 卦辞`
      referenceText = originalHex.judgment
      trendText = changedHex
        ? `三爻皆变，趋势指向「${changedHex.name}」，可参看变卦卦辞。`
        : ''
    } else if (movingCount === 4) {
      const targetIdx = staticIndices.length > 0 ? Math.min(...staticIndices) : 0
      const targetLine = changedHex?.lines[targetIdx]
      stepTitle = '四爻动'
      stepDesc = `四个爻动，以变卦静爻辞断之，取下爻（${targetLine?.name}）。`
      referenceName = `${changedHex?.name} · ${targetLine?.name}`
      referenceText = changedHex?.lines[targetIdx]?.judgement
      trendText = `大势已变，以变卦「${changedHex?.name}」为主。`
    } else if (movingCount === 5) {
      const targetIdx = staticIndices[0] || 0
      const targetLine = changedHex?.lines[targetIdx]
      stepTitle = '五爻动'
      stepDesc = `五个爻动，以变卦唯一静爻辞断之（${targetLine?.name}）。`
      referenceName = `${changedHex?.name} · ${targetLine?.name}`
      referenceText = changedHex?.lines[targetIdx]?.judgement
      trendText = `大势已变，以变卦「${changedHex?.name}」为主。`
    } else {
      if (originalHex.id === 1) {
        stepTitle = '六爻皆动（乾卦）'
        stepDesc = '乾卦六爻皆动，以"用九"断之。群龙无首，大吉。'
        referenceName = '乾 · 用九'
        referenceText = '用九：見群龍无首，吉。'
      } else if (originalHex.id === 2) {
        stepTitle = '六爻皆动（坤卦）'
        stepDesc = '坤卦六爻皆动，以"用六"断之。永远守正则有利。'
        referenceName = '坤 · 用六'
        referenceText = '用六：利永貞。'
      } else {
        stepTitle = '六爻皆动'
        stepDesc = '六爻皆动，物极必反，以变卦卦辞断之。'
        referenceName = `${changedHex?.name} · 卦辞`
        referenceText = changedHex?.judgment
      }
      trendText = `彻底转变，以变卦「${changedHex?.name}」为主。`
    }

    return (
      <div className="bg-card rounded-2xl p-5 mb-4">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-4 h-4 text-gold" />
          <div className="text-sm font-medium text-gold">解卦步骤</div>
        </div>

        {/* 步骤1：本卦 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">1</div>
          <div>
            <div className="text-sm text-text font-medium mb-0.5">确定本卦</div>
            <div className="text-xs text-gray">六爻成卦，本卦为「{originalHex.name}」。{originalHex.judgment}</div>
          </div>
        </div>

        {/* 步骤2：动爻分析 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">2</div>
          <div className="flex-1">
            <div className="text-sm text-text font-medium mb-0.5">分析动爻 · {stepTitle}</div>
            <div className="text-xs text-gray">{stepDesc}</div>
            {movingCount > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {lines.map((l, i) => l.moving ? (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/20">
                    {originalHex.lines[i]?.name} {l.value === 9 ? '○' : '×'}
                  </span>
                ) : null)}
              </div>
            )}
          </div>
        </div>

        {/* 步骤3：断卦参考 */}
        <div className="flex gap-3 mb-4">
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">3</div>
          <div className="flex-1">
            <div className="text-sm text-text font-medium mb-1">断卦参考</div>
            <div className="bg-surface rounded-lg p-3 border border-gold/10">
              <div className="text-xs text-gold mb-1">{referenceName}</div>
              <div className="text-sm text-text/90 leading-relaxed">{referenceText}</div>
            </div>
          </div>
        </div>

        {/* 步骤4：变卦趋势 */}
        {changedHex && (
          <div className="flex gap-3">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center font-medium">4</div>
            <div>
              <div className="text-sm text-text font-medium mb-0.5">变卦趋势</div>
              <div className="text-xs text-gray">{trendText}</div>
            </div>
          </div>
        )}
      </div>
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
            <div className="flex justify-center gap-5 mb-6">
              {(lastThrow ? lastThrow.coins : [0, 0, 0]).map((coin, i) => (
                <Coin
                  key={i}
                  index={i}
                  coin={coin}
                  throwing={throwing}
                  lastThrow={lastThrow}
                  revealed={revealed}
                />
              ))}
            </div>

            {revealed && lastThrow && (
              <div className="text-center mb-6 animate-[fadeIn_0.3s_ease-out]">
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
                    {renderLine(l.yang, l.moving, l.value)}
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

            {/* 卦象对比图：本卦 → 变卦 */}
            <div className="bg-card rounded-2xl p-5 mb-4">
              <div className="flex items-start justify-between">
                {/* 本卦 */}
                <div
                  className="flex-1 flex flex-col items-center cursor-pointer active:scale-98 transition-transform"
                  onClick={() => navigate(`/hexagrams/${originalHex.id}`)}
                >
                  <div className="text-xs text-gray mb-3">本卦</div>
                  <div className="flex flex-col-reverse items-center gap-1.5 mb-3">
                    {lines.map((l, i) => {
                      const marker = getMarker(l.value)
                      const barColor = l.moving
                        ? 'bg-gold-light shadow-[0_0_8px_rgba(245,215,122,0.5)]'
                        : l.yang ? 'bg-gold' : 'bg-muted'
                      return (
                        <div key={i} className="relative flex items-center w-20 h-5">
                          {l.yang ? (
                            <div className={`w-full h-[4px] rounded-full ${barColor} ${l.moving ? 'animate-pulse' : ''}`} />
                          ) : (
                            <div className={`w-full flex justify-between ${l.moving ? 'animate-pulse' : ''}`}>
                              <div className={`w-[44%] h-[4px] rounded-full ${barColor}`} />
                              <div className={`w-[44%] h-[4px] rounded-full ${barColor}`} />
                            </div>
                          )}
                          {marker && (
                            <span className="absolute -right-4 top-1/2 -translate-y-1/2 text-[10px] text-gold-light font-bold leading-none">
                              {marker}
                            </span>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <div className="text-2xl mb-0.5">{originalHex.trigramAbove}{originalHex.trigramBelow}</div>
                  <div className="text-lg font-medium text-gold">{originalHex.name}</div>
                  <div className="text-[10px] text-gray-500 mt-1 line-clamp-1 px-2">{originalHex.judgment}</div>
                </div>

                {/* 箭头 */}
                {changedHex && (
                  <div className="flex items-center self-center px-1 pt-6">
                    <ArrowRight className="w-5 h-5 text-gold/40" />
                  </div>
                )}

                {/* 变卦 */}
                {changedHex && changedLines && (
                  <div
                    className="flex-1 flex flex-col items-center cursor-pointer active:scale-98 transition-transform"
                    onClick={() => navigate(`/hexagrams/${changedHex.id}`)}
                  >
                    <div className="text-xs text-gray mb-3">变卦</div>
                    {renderHexagramDiagram(changedLines)}
                    <div className="text-2xl mb-0.5 mt-3">{changedHex.trigramAbove}{changedHex.trigramBelow}</div>
                    <div className="text-lg font-medium text-gold">{changedHex.name}</div>
                    <div className="text-[10px] text-gray-500 mt-1 line-clamp-1 px-2">{changedHex.judgment}</div>
                  </div>
                )}
              </div>

              {/* 无动爻提示 */}
              {!lines.some(l => l.moving) && (
                <div className="text-center text-sm text-gray mt-4 pt-3 border-t border-gold/10">
                  六爻皆静，以本卦卦辞断之。
                </div>
              )}
            </div>

            {/* 解卦步骤 */}
            <DivinationGuide lines={lines} originalHex={originalHex} changedHex={changedHex} />

            {/* 六爻详情 */}
            <div className="bg-card rounded-2xl p-4 mb-4">
              <div className="text-xs text-gray mb-3">六爻（从下至上）</div>
              <div className="space-y-2.5">
                {lines.map((l, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-gray w-8 flex-shrink-0">{getLineName(i, l.yang)}</span>
                    {renderLine(l.yang, l.moving, l.value)}
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
