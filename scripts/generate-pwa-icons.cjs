/**
 * 生成 PWA 图标 - 八卦/太极风格
 * 黑底金纹，与 App 主题（primary #0D0D0D + gold #D4AF37）一致
 * 依赖 sharp（已在 package.json）
 *
 * 生成：
 *   public/pwa/icon-192.png
 *   public/pwa/icon-512.png
 *   public/pwa/icon-maskable-192.png   (带安全边距，安卓适配)
 *   public/pwa/icon-maskable-512.png
 *   public/pwa/apple-touch-icon.png    (180x180)
 *   public/pwa/favicon.svg             (矢量favicon)
 */
const fs = require('fs')
const path = require('path')
const sharp = require('sharp')

const OUT_DIR = path.join(__dirname, '..', 'public', 'pwa')
fs.mkdirSync(OUT_DIR, { recursive: true })

const GOLD = '#D4AF37'
const GOLD_LIGHT = '#F5D77A'
const BG = '#0D0D0D'

/**
 * 生成太极八卦 SVG 字符串
 * @param {number} size 画布尺寸
 * @param {number} padding 内边距（maskable 用，留出安全区）
 */
function taichiSvg(size, padding = 0) {
  const cx = size / 2
  const cy = size / 2
  const R = (size / 2) - padding - size * 0.04   // 大圆半径
  const r = R / 2                                  // 小圆半径
  const stroke = Math.max(2, size * 0.012)

  // 太极阴阳鱼路径（标准 S 形）
  const taichiPath = [
    `M ${cx} ${cy - R}`,
    `A ${R} ${R} 0 0 1 ${cx} ${cy + R}`,
    `A ${r} ${r} 0 0 1 ${cx} ${cy}`,
    `A ${r} ${r} 0 0 0 ${cx} ${cy - R}`,
    'Z',
  ].join(' ')

  // 八个卦的爻线（乾兑离震巽坎艮坤，按先天八卦顺序环绕）
  // 每卦 3 爻，阳爻=实线，阴爻=断线
  const bagua = [
    [1, 1, 1], // 乾 ☰
    [1, 1, 0], // 兑 ☱
    [1, 0, 1], // 离 ☲
    [0, 0, 1], // 震 ☳
    [1, 0, 0], // 巽 ☴
    [0, 1, 1], // 坎 ☵
    [0, 1, 0], // 艮 ☶
    [0, 0, 0], // 坤 ☷
  ]

  const baguaR = R + size * 0.06          // 卦线距圆心的距离
  const lineLen = size * 0.13             // 单爻线长度
  const lineW = Math.max(2, size * 0.018) // 爻线粗细
  const gap = lineW * 1.8                 // 阴爻中断间距
  const yStep = lineW * 2.4               // 爻间距

  let baguaEls = ''
  bagua.forEach((yao, i) => {
    const angle = (i * 45 - 90) * Math.PI / 180  // 从正上方开始，顺时针
    const bx = cx + baguaR * Math.cos(angle)
    const by = cy + baguaR * Math.sin(angle)
    // 三爻，从外到内
    yao.forEach((isYang, j) => {
      const offset = (j - 1) * yStep
      // 沿径向方向排列爻线，切向画线
      const tx = -Math.sin(angle) // 切向单位向量
      const ty = Math.cos(angle)
      const px = bx + offset * Math.cos(angle)
      const py = by + offset * Math.sin(angle)
      const x1 = px - tx * lineLen / 2
      const y1 = py - ty * lineLen / 2
      const x2 = px + tx * lineLen / 2
      const y2 = py + ty * lineLen / 2
      if (isYang) {
        baguaEls += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${GOLD}" stroke-width="${lineW}" stroke-linecap="round"/>`
      } else {
        const mx = px - tx * lineLen / 2
        const my = py - ty * lineLen / 2
        const m1x = mx + tx * (lineLen / 2 - gap / 2)
        const m1y = my + ty * (lineLen / 2 - gap / 2)
        const m2x = px + tx * gap / 2
        const m2y = py + ty * gap / 2
        const half = lineLen / 2 - gap / 2
        baguaEls += `<line x1="${mx}" y1="${my}" x2="${mx + tx*half}" y2="${my + ty*half}" stroke="${GOLD}" stroke-width="${lineW}" stroke-linecap="round"/>`
        baguaEls += `<line x1="${m2x}" y1="${m2y}" x2="${m2x + tx*half}" y2="${m2y + ty*half}" stroke="${GOLD}" stroke-width="${lineW}" stroke-linecap="round"/>`
      }
    })
  })

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${BG}"/>
    <circle cx="${cx}" cy="${cy}" r="${R + size*0.03}" fill="none" stroke="${GOLD}" stroke-width="${stroke}" opacity="0.4"/>
    ${baguaEls}
    <path d="${taichiPath}" fill="${GOLD_LIGHT}"/>
    <circle cx="${cx}" cy="${cy - r/2}" r="${r/4}" fill="${BG}"/>
    <circle cx="${cx}" cy="${cy + r/2}" r="${r/4}" fill="${GOLD_LIGHT}"/>
    <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${GOLD}" stroke-width="${stroke}"/>
  </svg>`
}

async function renderPng(svgStr, size, outFile) {
  await sharp(Buffer.from(svgStr))
    .resize(size, size)
    .png()
    .toFile(outFile)
  console.log(`  ✓ ${path.relative(path.join(__dirname, '..'), outFile)}`)
}

async function main() {
  console.log('生成 PWA 图标（太极八卦风格）...')

  // 普通图标
  await renderPng(taichiSvg(512, 0), 192, path.join(OUT_DIR, 'icon-192.png'))
  await renderPng(taichiSvg(512, 0), 512, path.join(OUT_DIR, 'icon-512.png'))

  // maskable 图标（带 10% 安全区，安卓圆形/方形裁剪适配）
  await renderPng(taichiSvg(512, 512 * 0.1), 192, path.join(OUT_DIR, 'icon-maskable-192.png'))
  await renderPng(taichiSvg(512, 512 * 0.1), 512, path.join(OUT_DIR, 'icon-maskable-512.png'))

  // Apple touch icon（iOS 主屏图标）
  await renderPng(taichiSvg(512, 0), 180, path.join(OUT_DIR, 'apple-touch-icon.png'))

  // favicon.svg（矢量）
  const favicon = taichiSvg(64, 0)
  fs.writeFileSync(path.join(OUT_DIR, 'favicon.svg'), favicon)
  console.log(`  ✓ public/pwa/favicon.svg`)

  console.log('\n全部生成完成')
}

main().catch(e => { console.error(e); process.exit(1) })
