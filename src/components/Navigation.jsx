import { NavLink } from 'react-router-dom'
import { Hexagon, Sparkles, BookOpen, User } from 'lucide-react'

const tabs = [
  { path: '/', icon: Hexagon, label: '卦象' },
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
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full transition-colors ${
                isActive ? 'text-gold' : 'text-gray-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <tab.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2 : 1.5} />
                <span className="text-xs">{tab.label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
