import { NavLink } from 'react-router-dom'
import { Home, Hexagon, Sparkles, BookOpen, User } from 'lucide-react'

const tabs = [
  { path: '/', icon: Home, label: '首页', end: true },
  { path: '/hexagrams', icon: Hexagon, label: '卦象' },
  { path: '/divination', icon: Sparkles, label: '占卜' },
  { path: '/library', icon: BookOpen, label: '书库' },
  { path: '/profile', icon: User, label: '我的' },
]

export default function Navigation() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface border-t border-gold/20 z-50">
      <div className="flex justify-around items-center h-16 max-w-lg mx-auto">
        {tabs.map((tab) => (
          <NavLink
            key={tab.path}
            to={tab.path}
            end={tab.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-gold' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className="w-5 h-5 md:w-6 md:h-6 mb-0.5 md:mb-1" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-[10px] md:text-xs">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
