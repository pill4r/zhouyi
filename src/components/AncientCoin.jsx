/**
 * 古币 SVG 组件
 * 纯代码绘制外圆中方的传统铜钱，无需外部素材
 * 支持字面/背面/投掷中状态，兼容主题动画类名
 */

const COIN_SIZE = 72

function CoinSVG({ face }) {
  const isWord = face === 'word'

  return (
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 100 100"
      style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.4))' }}
    >
      <defs>
        {/* 铜质径向渐变 */}
        <radialGradient id="coinFace" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#E8C87A" />
          <stop offset="35%" stopColor="#C9A04E" />
          <stop offset="70%" stopColor="#A07830" />
          <stop offset="100%" stopColor="#6B4E1E" />
        </radialGradient>
        <radialGradient id="coinFaceBack" cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#C4A055" />
          <stop offset="40%" stopColor="#9E7B3A" />
          <stop offset="80%" stopColor="#7A5A26" />
          <stop offset="100%" stopColor="#5C4218" />
        </radialGradient>
        {/* 外圈凸起高光 */}
        <linearGradient id="rimLight" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F0D89A" stopOpacity="0.8" />
          <stop offset="50%" stopColor="#B88A3E" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#5C3F12" stopOpacity="0.9" />
        </linearGradient>
      </defs>

      {/* 外圆底 */}
      <circle cx="50" cy="50" r="48" fill={isWord ? 'url(#coinFace)' : 'url(#coinFaceBack)'} />

      {/* 外圈凸起边缘 */}
      <circle cx="50" cy="50" r="46" fill="none" stroke="url(#rimLight)" strokeWidth="2.5" />
      <circle cx="50" cy="50" r="43" fill="none" stroke="#4A3410" strokeWidth="0.8" opacity="0.6" />

      {/* 内圈装饰线 */}
      <circle cx="50" cy="50" r="38" fill="none" stroke={isWord ? '#8B6914' : '#6B4F18'} strokeWidth="0.6" opacity="0.5" />
      <circle cx="50" cy="50" r="35" fill="none" stroke={isWord ? '#7A5A10' : '#5C4214'} strokeWidth="0.4" opacity="0.4" strokeDasharray="2 3" />

      {/* 中心方孔 */}
      <rect x="41" y="41" width="18" height="18" rx="1.5" fill="#0F0F1A" />
      <rect x="41" y="41" width="18" height="18" rx="1.5" fill="none" stroke="#2A1F0A" strokeWidth="1" />

      {/* 字面：中间大字 */}
      {isWord && (
        <>
          <text
            x="50"
            y="54"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="22"
            fontWeight="bold"
            fontFamily="serif"
            fill="#3D2808"
            opacity="0.15"
            transform="translate(0.8, 0.8)"
          >
            字
          </text>
          <text
            x="50"
            y="54"
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="22"
            fontWeight="bold"
            fontFamily="serif"
            fill="#4A3510"
          >
            字
          </text>
        </>
      )}

      {/* 背面：简单纹路 */}
      {!isWord && (
        <>
          <circle cx="50" cy="50" r="28" fill="none" stroke="#5C4218" strokeWidth="0.5" opacity="0.5" />
          <circle cx="50" cy="50" r="24" fill="none" stroke="#5C4218" strokeWidth="0.5" opacity="0.4" />
          <circle cx="50" cy="28" r="1.8" fill="#6B4E1E" opacity="0.6" />
          <circle cx="50" cy="72" r="1.8" fill="#6B4E1E" opacity="0.6" />
          <circle cx="28" cy="50" r="1.8" fill="#6B4E1E" opacity="0.6" />
          <circle cx="72" cy="50" r="1.8" fill="#6B4E1E" opacity="0.6" />
        </>
      )}

      {/* 全局高光 */}
      <ellipse cx="35" cy="32" rx="16" ry="10" fill="#F5E6B8" opacity="0.12" transform="rotate(-30, 35, 32)" />
    </svg>
  )
}

/**
 * 古币组件 - 用于占卜页面
 * 完全替换原先的 <img> 方式，保留所有 CSS 动画
 *
 * @param {string} face - 'word' 字面 | 'back' 背面 | 'unknown' 未知
 * @param {string} animClass - CSS 动画类名 (coin-idle / coin-flip-0 / coin-reveal / coin-glow 等)
 * @param {boolean} active - 是否高亮（字面时）
 * @param {boolean} small - 是否小尺寸
 * @param {boolean} unknown - 是否投掷中/未知
 */
export default function AncientCoin({
  face = 'unknown',
  animClass = '',
  active = false,
  small = false,
}) {
  const size = small ? 40 : COIN_SIZE

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

  return (
    <div
      className={`relative ${animClass} ${active ? 'coin-glow' : ''}`}
      style={{ width: size, height: size, perspective: '500px' }}
    >
      <CoinSVG face={face} />
    </div>
  )
}
