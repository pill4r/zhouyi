import { useState } from 'react'
import { bagua } from '../data/bagua'

export default function LibraryPage() {
  const [activeSection, setActiveSection] = useState('bagua')

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <h1 className="text-xl font-semibold text-gold mb-3">书库</h1>
        
        {/* Section tabs */}
        <div className="flex gap-2">
          {[
            { key: 'bagua', label: '八卦详解' },
            { key: 'theory', label: '周易理论' },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              className={`px-3 py-1 rounded-full text-xs transition-colors ${
                activeSection === tab.key
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
        {activeSection === 'bagua' && (
          <div className="space-y-4">
            {bagua.map((bag) => (
              <div key={bag.id} className="bg-card rounded-xl p-4">
                <div className="flex items-center gap-4 mb-3">
                  <div className="text-4xl">{bag.symbol}</div>
                  <div>
                    <div className="text-lg font-medium text-gold">{bag.name}</div>
                    <div className="text-sm text-gray">{bag.meaning}</div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="bg-surface rounded-lg p-2">
                    <span className="text-gray">五行：</span>
                    <span className="text-gold-light">{bag.elements}</span>
                  </div>
                  <div className="bg-surface rounded-lg p-2">
                    <span className="text-gray">特性：</span>
                    <span className="text-gold-light">{bag.qualities}</span>
                  </div>
                </div>

                <div className="mt-3 text-sm text-text/80">
                  <p>卦象象征{bag.meaning}，代表{bag.qualities}。在周易体系中，{bag.name}卦位列{getPosition(bag.id)}，五行属{bag.elements}。</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeSection === 'theory' && (
          <div className="space-y-4">
            <TheoryCard
              title="阴阳之道"
              content="阴阳是周易的根本概念。阳代表积极、刚健、光明；阴代表消极、柔顺、黑暗。万事万物皆由阴阳相互作用而生成变化。"
            />
            <TheoryCard
              title="八卦起源"
              content="八卦由伏羲氏观天地万物之象而创。三个爻的组合形成八种基本符号，分别代表天、地、雷、风、水、火、山、泽八种自然现象。"
            />
            <TheoryCard
              title="五行相生相克"
              content="木生火、火生土、土生金、金生水、水生木；木克土、土克水、水克火、火克金、金克木。五行相生相克，构成宇宙的基本动态平衡。"
            />
            <TheoryCard
              title="六十四卦"
              content="八卦两两相重，形成六十四卦。每卦六爻，从下往上数。初爻为始，上爻为终。通过卦象的变化，揭示事物发展的规律。"
            />
          </div>
        )}
      </main>
    </div>
  )
}

function getPosition(id) {
  const positions = ['一', '二', '三', '四', '五', '六', '七', '八']
  return positions[id - 1] || id
}

function TheoryCard({ title, content }) {
  return (
    <div className="bg-card rounded-xl p-4">
      <h3 className="text-gold font-medium mb-2">{title}</h3>
      <p className="text-sm text-text/80 leading-relaxed">{content}</p>
    </div>
  )
}
