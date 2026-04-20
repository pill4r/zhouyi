import { useState } from 'react'
import { bagua } from '../data/bagua'
import { librarySections } from '../data/libraryArticles'
import { ChevronDown, ChevronRight, MapPin, Calendar, User as UserIcon, Heart, Palette } from 'lucide-react'

const positionNames = ['一', '二', '三', '四', '五', '六', '七', '八']

export default function LibraryPage() {
  const [activeSection, setActiveSection] = useState('basics')
  const [expandedArticle, setExpandedArticle] = useState(null)
  const [expandedBagua, setExpandedBagua] = useState(null)

  const toggleArticle = (id) => {
    setExpandedArticle(expandedArticle === id ? null : id)
  }

  const toggleBagua = (id) => {
    setExpandedBagua(expandedBagua === id ? null : id)
  }

  const currentSection = librarySections.find(s => s.id === activeSection)

  return (
    <div className="min-h-screen bg-primary">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-surface border-b border-gold/20 px-5 py-4">
        <h1 className="text-xl font-semibold text-gold mb-3">书库</h1>

        {/* Section tabs - horizontal scroll */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
          {librarySections.map(section => (
            <button
              key={section.id}
              onClick={() => { setActiveSection(section.id); setExpandedArticle(null) }}
              className={`px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors flex items-center gap-1 ${
                activeSection === section.id
                  ? 'bg-gold text-primary'
                  : 'bg-card text-gray'
              }`}
            >
              <span>{section.icon}</span>
              <span>{section.title}</span>
            </button>
          ))}
        </div>
      </header>

      <main className="p-5 pb-8">
        {/* Bagua Detail Section */}
        {activeSection === 'bagua-detail' && (
          <BaguaSection
            expandedBagua={expandedBagua}
            onToggle={toggleBagua}
          />
        )}

        {/* Other Sections */}
        {activeSection !== 'bagua-detail' && currentSection && (
          <ArticleList
            section={currentSection}
            expandedArticle={expandedArticle}
            onToggle={toggleArticle}
          />
        )}
      </main>
    </div>
  )
}

function BaguaSection({ expandedBagua, onToggle }) {
  return (
    <div className="space-y-3">
      {bagua.map((bag) => (
        <div key={bag.id} className="bg-card rounded-xl overflow-hidden">
          {/* Summary */}
          <button
            onClick={() => onToggle(bag.id)}
            className="w-full flex items-center gap-4 p-4 text-left"
          >
            <div className="text-4xl leading-none">{bag.symbol}</div>
            <div className="flex-1">
              <div className="text-lg font-medium text-gold">{bag.name}</div>
              <div className="text-sm text-gray">{bag.meaning} · {bag.elements} · {bag.qualities}</div>
            </div>
            {expandedBagua === bag.id
              ? <ChevronDown className="w-5 h-5 text-gray shrink-0" />
              : <ChevronRight className="w-5 h-5 text-gray shrink-0" />
            }
          </button>

          {/* Expanded Detail */}
          {expandedBagua === bag.id && (
            <div className="px-4 pb-4 space-y-3 border-t border-gold/10">
              {/* Image (大象传) */}
              <div className="mt-3 bg-surface rounded-lg p-3">
                <div className="text-xs text-gray mb-1">大象</div>
                <div className="text-gold font-medium">{bag.image}</div>
              </div>

              {/* Description */}
              <p className="text-sm text-text/80 leading-relaxed">{bag.description}</p>

              {/* Quick Info Grid */}
              <div className="grid grid-cols-3 gap-2 text-sm">
                <InfoChip icon={<MapPin className="w-3.5 h-3.5" />} label="方位" value={bag.direction} />
                <InfoChip icon={<Calendar className="w-3.5 h-3.5" />} label="季节" value={bag.season} />
                <InfoChip icon={<UserIcon className="w-3.5 h-3.5" />} label="家庭" value={bag.family} />
                <InfoChip icon={<Heart className="w-3.5 h-3.5" />} label="情感" value={bag.emotion} />
                <InfoChip icon={<Palette className="w-3.5 h-3.5" />} label="颜色" value={bag.color} />
                <InfoChip icon={<span className="text-xs">🔢</span>} label="先天数" value={bag.number} />
              </div>

              {/* Correspondences */}
              {bag.correspondences && (
                <div className="bg-surface rounded-lg p-3">
                  <div className="text-xs text-gray mb-2">万物类象</div>
                  <div className="grid grid-cols-2 gap-y-1.5 gap-x-3 text-sm">
                    {Object.entries(bag.correspondences).map(([key, val]) => (
                      <div key={key}>
                        <span className="text-gray">{key}：</span>
                        <span className="text-gold-light">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ArticleList({ section, expandedArticle, onToggle }) {
  if (!section.articles || section.articles.length === 0) {
    return (
      <div className="text-center text-gray py-12">
        <p className="text-lg mb-2">📚</p>
        <p className="text-sm">内容建设中...</p>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {section.articles.map((article) => (
        <div key={article.id} className="bg-card rounded-xl overflow-hidden">
          {/* Summary */}
          <button
            onClick={() => onToggle(article.id)}
            className="w-full flex items-center gap-3 p-4 text-left"
          >
            <div className="flex-1">
              <div className="font-medium text-gold">{article.title}</div>
              {article.subtitle && (
                <div className="text-xs text-gray mt-0.5">{article.subtitle}</div>
              )}
            </div>
            {expandedArticle === article.id
              ? <ChevronDown className="w-5 h-5 text-gray shrink-0" />
              : <ChevronRight className="w-5 h-5 text-gray shrink-0" />
            }
          </button>

          {/* Expanded Content */}
          {expandedArticle === article.id && (
            <div className="px-4 pb-4 border-t border-gold/10">
              <ArticleContent content={article.content} />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

function ArticleContent({ content }) {
  // Parse content: handle **bold**, bullet points, and paragraphs
  const lines = content.split('\n').filter(l => l.trim() !== '')
  const elements = []
  let i = 0

  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed.startsWith('•')) {
      // Bullet point
      elements.push(
        <div key={i++} className="flex gap-2 py-1 text-sm text-text/80">
          <span className="text-gold shrink-0">•</span>
          <span>{parseInlineFormatting(trimmed.slice(1).trim())}</span>
        </div>
      )
    } else {
      // Regular paragraph
      elements.push(
        <p key={i++} className="text-sm text-text/80 leading-relaxed py-1.5">
          {parseInlineFormatting(trimmed)}
        </p>
      )
    }
  }

  return <div className="mt-3">{elements}</div>
}

function parseInlineFormatting(text) {
  // Handle **bold** text
  const parts = text.split(/(\*\*[^*]+\*\*)/)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <span key={i} className="text-gold font-medium">{part.slice(2, -2)}</span>
    }
    return part
  })
}

function InfoChip({ icon, label, value }) {
  return (
    <div className="bg-surface rounded-lg p-2 flex flex-col items-center text-center">
      <div className="text-gray flex items-center gap-1 mb-0.5">{icon} <span className="text-xs">{label}</span></div>
      <div className="text-gold-light text-xs font-medium">{value}</div>
    </div>
  )
}
