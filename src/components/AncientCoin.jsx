/**
 * 古币组件 - 用于占卜页面
 * 使用真实古钱币照片素材 (coin-zi.png / coin-bei.png)
 * 保留所有 CSS 动画类名兼容性
 *
 * @param {string} face - 'word' 字面 | 'back' 背面 | 'unknown' 未知
 * @param {string} animClass - CSS 动画类名
 * @param {boolean} active - 是否高亮
 * @param {boolean} small - 是否小尺寸
 */

const COIN_SIZE = 72

export default function AncientCoin({
  face = 'unknown',
  animClass = '',
  active = false,
  small = false,
}) {
  const size = small ? 40 : COIN_SIZE

  // 未投掷状态：显示问号
  if (face === 'unknown') {
    return (
      <div
        className={`flex items-center justify-center rounded-full border-2 border-dashed border-gold/30 bg-card/50 ${animClass}`}
        style={{ width: size, height: size, perspective: '500px' }}
      >
        <span className="text-gold/40 text-lg">?</span>
      </div>
    )
  }

  const src = face === 'word' ? '/coins/coin-zi.png' : '/coins/coin-bei.png'
  const label = face === 'word' ? '字' : '背'

  return (
    <div
      className={`relative ${animClass} ${active ? 'coin-glow' : ''}`}
      style={{ width: size, height: size, perspective: '500px' }}
    >
      <img
        src={src}
        alt={`古钱币${label}面`}
        className="w-full h-full rounded-full object-cover"
        style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
        draggable={false}
      />
    </div>
  )
}
