const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const outputDir = path.join(__dirname, '..', 'public', 'coins');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 字面 SVG - 开元通宝
const coinZiSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <style>
      @font-face {
        font-family: 'WQY';
        src: url('/usr/share/fonts/truetype/wqy/wqy-zenhei.ttc');
      }
      .char { font-family: 'WQY', serif; font-weight: bold; }
    </style>
    <radialGradient id="bronze" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#E8D5A0"/>
      <stop offset="20%" stop-color="#D4AF37"/>
      <stop offset="45%" stop-color="#B8941E"/>
      <stop offset="70%" stop-color="#8A6D14"/>
      <stop offset="90%" stop-color="#6A5010"/>
      <stop offset="100%" stop-color="#4A3810"/>
    </radialGradient>
    <linearGradient id="rim" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#E0C880"/>
      <stop offset="50%" stop-color="#A08030"/>
      <stop offset="100%" stop-color="#503810"/>
    </linearGradient>
    <linearGradient id="sheen" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.4)"/>
      <stop offset="30%" stop-color="rgba(255,255,255,0.05)"/>
      <stop offset="70%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.3)"/>
    </linearGradient>
    <filter id="patina">
      <feTurbulence type="fractalNoise" baseFrequency="0.08" numOctaves="5" seed="1" result="noise"/>
      <feColorMatrix type="matrix" values="0.3 0 0 0 0  0.5 0 0 0 0  0.3 0 0 0 0  0 0 0 1 0" in="noise" result="coloredNoise"/>
      <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" result="blended"/>
    </filter>
    <filter id="rough">
      <feTurbulence type="fractalNoise" baseFrequency="0.15" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="2" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="shadow">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  
  <circle cx="200" cy="200" r="190" fill="rgba(0,0,0,0.3)" filter="url(#shadow)"/>
  
  <g filter="url(#rough)">
    <circle cx="200" cy="200" r="185" fill="url(#bronze)" stroke="url(#rim)" stroke-width="4"/>
    <circle cx="200" cy="200" r="170" fill="none" stroke="#B8941E" stroke-width="1" opacity="0.6"/>
    <circle cx="200" cy="200" r="165" fill="none" stroke="#8A6D14" stroke-width="0.5" opacity="0.4"/>
    <circle cx="200" cy="200" r="180" fill="url(#bronze)" filter="url(#patina)" opacity="0.3"/>
    <circle cx="200" cy="200" r="185" fill="url(#sheen)"/>
    
    <rect x="172" y="172" width="56" height="56" rx="3" fill="#1A1208" stroke="#6A5010" stroke-width="2"/>
    <rect x="174" y="174" width="52" height="52" rx="2" fill="#0D0A04" stroke="#3A2A10" stroke-width="1"/>
    
    <g class="char" text-anchor="middle" fill="#3D2808">
      <text x="200" y="118" font-size="46">é¶š</text>
      <text x="200" y="312" font-size="46">å…ƒ</text>
      <text x="288" y="220" font-size="46">é€š</text>
      <text x="112" y="220" font-size="46">å®‹</text>
    </g>
    <g class="char" text-anchor="middle" fill="#E8D5A0" opacity="0.3">
      <text x="198" y="116" font-size="46">é¶š</text>
      <text x="198" y="310" font-size="46">å…ƒ</text>
      <text x="286" y="218" font-size="46">é€š</text>
      <text x="110" y="218" font-size="46">å®‹</text>
    </g>
    
    <path d="M 80 150 Q 120 160 140 200" fill="none" stroke="rgba(100,80,30,0.15)" stroke-width="3" stroke-linecap="round"/>
    <path d="M 280 180 Q 310 200 300 250" fill="none" stroke="rgba(100,80,30,0.1)" stroke-width="2" stroke-linecap="round"/>
  </g>
</svg>`;

// 背面 SVG
const coinBeiSVG = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <radialGradient id="bronzeBack" cx="40%" cy="35%" r="60%">
      <stop offset="0%" stop-color="#8A7A5A"/>
      <stop offset="25%" stop-color="#6A5A3A"/>
      <stop offset="50%" stop-color="#504A2A"/>
      <stop offset="75%" stop-color="#3A3218"/>
      <stop offset="100%" stop-color="#2A2208"/>
    </radialGradient>
    <linearGradient id="rimBack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#9A8A6A"/>
      <stop offset="50%" stop-color="#6A5A3A"/>
      <stop offset="100%" stop-color="#3A3218"/>
    </linearGradient>
    <linearGradient id="sheenBack" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="rgba(255,255,255,0.2)"/>
      <stop offset="35%" stop-color="rgba(255,255,255,0.03)"/>
      <stop offset="70%" stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.25)"/>
    </linearGradient>
    <filter id="patinaBack">
      <feTurbulence type="fractalNoise" baseFrequency="0.06" numOctaves="5" seed="3" result="noise"/>
      <feColorMatrix type="matrix" values="0.2 0 0 0 0  0.4 0 0 0 0  0.2 0 0 0 0  0 0 0 1 0" in="noise" result="coloredNoise"/>
      <feBlend in="SourceGraphic" in2="coloredNoise" mode="multiply" result="blended"/>
    </filter>
    <filter id="roughBack">
      <feTurbulence type="fractalNoise" baseFrequency="0.12" numOctaves="3" result="noise"/>
      <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.5" xChannelSelector="R" yChannelSelector="G"/>
    </filter>
    <filter id="shadowBack">
      <feDropShadow dx="0" dy="3" stdDeviation="5" flood-color="#000" flood-opacity="0.5"/>
    </filter>
  </defs>
  
  <circle cx="200" cy="200" r="190" fill="rgba(0,0,0,0.3)" filter="url(#shadowBack)"/>
  
  <g filter="url(#roughBack)">
    <circle cx="200" cy="200" r="185" fill="url(#bronzeBack)" stroke="url(#rimBack)" stroke-width="4"/>
    <circle cx="200" cy="200" r="170" fill="none" stroke="#6A5A3A" stroke-width="1" opacity="0.5"/>
    <circle cx="200" cy="200" r="165" fill="none" stroke="#5A4A2A" stroke-width="0.5" opacity="0.3"/>
    <circle cx="200" cy="200" r="180" fill="url(#bronzeBack)" filter="url(#patinaBack)" opacity="0.4"/>
    <circle cx="200" cy="200" r="185" fill="url(#sheenBack)"/>
    
    <rect x="172" y="172" width="56" height="56" rx="3" fill="#121008" stroke="#4A3A18" stroke-width="2"/>
    <rect x="174" y="174" width="52" height="52" rx="2" fill="#0A0804" stroke="#2A2210" stroke-width="1"/>
    
    <circle cx="200" cy="200" r="80" fill="none" stroke="#5A4A2A" stroke-width="0.8" opacity="0.3"/>
    <circle cx="200" cy="200" r="65" fill="none" stroke="#5A4A2A" stroke-width="0.6" opacity="0.2"/>
    <circle cx="200" cy="200" r="50" fill="none" stroke="#5A4A2A" stroke-width="0.4" opacity="0.15"/>
    
    <path d="M 200 95 A 15 15 0 0 1 200 125 A 11 11 0 0 0 200 95" fill="none" stroke="#6A5A3A" stroke-width="1.5" opacity="0.35"/>
    
    <circle cx="200" cy="135" r="2.5" fill="none" stroke="#6A5A3A" stroke-width="1" opacity="0.3"/>
    <circle cx="200" cy="265" r="2.5" fill="none" stroke="#6A5A3A" stroke-width="1" opacity="0.3"/>
    <circle cx="135" cy="200" r="2.5" fill="none" stroke="#6A5A3A" stroke-width="1" opacity="0.3"/>
    <circle cx="265" cy="200" r="2.5" fill="none" stroke="#6A5A3A" stroke-width="1" opacity="0.3"/>
  </g>
</svg>`;

async function generate() {
  try {
    await sharp(Buffer.from(coinZiSVG), { density: 300 })
      .png()
      .toFile(path.join(outputDir, 'coin-zi.png'));
    console.log('\u2705 \u5b57\u9762\u53e4\u5e01\u5df2\u751f\u6210');
    
    await sharp(Buffer.from(coinBeiSVG), { density: 300 })
      .png()
      .toFile(path.join(outputDir, 'coin-bei.png'));
    console.log('\u2705 \u80cc\u9762\u53e4\u5e01\u5df2\u751f\u6210');
    
    const files = fs.readdirSync(outputDir);
    console.log('\n\u76ee\u5f55\u5185\u5bb9:');
    files.forEach(f => {
      const stat = fs.statSync(path.join(outputDir, f));
      console.log(`  ${f}: ${stat.size} bytes`);
    });
    
    console.log('\n\u5b8c\u6210\uff01');
  } catch (err) {
    console.error('\u274c \u9519\u8bef:', err.message);
    process.exit(1);
  }
}

generate();
