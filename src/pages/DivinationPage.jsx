import { useState } from 'react'
import hexagramsData from '../data/hexagrams.json'

export default function DivinationPage() {
  const [step, setStep] = useState(0) // 0: ready, 1: throwing, 2: result
  const [coins, setCoins] = useState([])
  const [result, setResult] = useState(null)
  const [animation, setAnimation] = useState(false)

  // 硬币正反面: true = 阳, false = 阴
  const coinFaces = [false, true, false] // 3个硬币的初始值
  
  async function throwCoins() {
    setStep(1)
    setAnimation(true)
    setCoins([])
    
    // 动画效果
    await new Promise(r => setTimeout(r, 600))
    
    // 生成随机结果
    const throws = []
    for (let i = 0; i < 6; i++) {
      // 3个硬币的和: 3阳(3), 2阳1阴(2), 1阳2阴(1), 3阴(0)
      const sum = [0, 1, 2, 3][Math.floor(Math.random() * 4)]
      const line = sum >= 2 ? '1' : '0' // >=2阳, <2阴
      throws.push({ coins: sum, line, yang: sum >= 2 })
    }
    
    setCoins(throws)
    setAnimation(false)
    
    // 计算卦象
    const hexLines = throws.map(t => t.line).join('')
    // 查找匹配的卦象 (从下往上)
    const reversed = hexLines.split('').reverse().join('')
    const matched = hexagramsData.find(h => {
      const hLines = (h.trigramBelow + h.trigramAbove).split('').map(c => 
        c === '☰' ? '1' : '0'
      ).reverse().join('')
      return hLines === hexLines
    }) || hexagramsData.find(h => {
      const hLines = (h.trigramBelow + h.trigramAbove).split('').map(c => 
        c === '☰' ? '1' : '0'
      ).reverse().join('')
      return hLines === reversed
    })
    
    await new Promise(r => setTimeout(r, 500))
    setResult(matched || null)
    setStep(2)
  }

  function reset() {
    setStep(0)
    setCoins([])
    setResult(null)
  }

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <h1 className="text-xl font-semibold text-gold">占卜</h1>
      </header>

      <main className="p-5 pb-8 flex flex-col items-center">
        {step === 0 && (
          <div className="text-center mt-20">
            <div className="text-8xl mb-8 animate-pulse">☰</div>
            <p className="text-gray mb-8 max-w-xs mx-auto">
              诚心默念所问之事<br/>
              然后点击下方按钮开始占卜
            </p>
            <button
              onClick={throwCoins}
              className="bg-gold text-primary font-medium px-8 py-3 rounded-full active:scale-95 transition-transform"
            >
              开始占卜
            </button>
          </div>
        )}

        {step === 1 && (
          <div className="text-center mt-20">
            <div className={`text-8xl mb-8 ${animation ? 'animate-bounce' : ''}`}>
              {animation ? '⚊' : ''}
            </div>
            <p className="text-gold animate-pulse">掷铜钱中...</p>
          </div>
        )}

        {step === 2 && result && (
          <div className="text-center w-full">
            {/* 卦象展示 */}
            <div className="bg-card rounded-2xl p-6 mb-6">
              <div className="text-6xl mb-4">
                {result.trigramAbove}{result.trigramBelow}
              </div>
              <div className="text-2xl font-medium text-gold mb-2">{result.nameCn}</div>
              <div className="text-gray">{result.judgment}</div>
            </div>

            {/* 六爻 */}
            <div className="bg-surface rounded-xl p-4 mb-6">
              <div className="text-sm text-gray mb-3">六爻（从下至上）</div>
              <div className="space-y-2">
                {coins.slice().reverse().map((c, i) => (
                  <div key={i} className="flex items-center justify-center gap-3">
                    <span className="text-xs text-gray w-8">
                      {['初爻', '二爻', '三爻', '四爻', '五爻', '上爻'][5-i]}
                    </span>
                    <span className={`text-2xl ${c.yang ? 'text-gold' : 'text-gray'}`}>
                      {c.yang ? '——' : '— —'}
                    </span>
                    <span className="text-xs text-gray w-20">
                      动{result.lines?.[5-i]?.name || ''}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={reset}
              className="text-gold border border-gold/50 px-6 py-2 rounded-full active:scale-95 transition-transform"
            >
              重新占卜
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
