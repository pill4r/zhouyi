import { NavLink } from 'react-router-dom'

const tabs = [
  { path: '/', icon: '⬡', label: '卦象' },
  { path: '/divination', icon: '★', label: '占卜' },
  { path: '/library', icon: '📖', label: '书库' },
  { path: '/profile', icon: '👤', label: '我的' },
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
                isActive ? 'text-gold' : 'text-gray'
              }`
            }
          >
            <span className="text-2xl mb-1">{tab.icon}</span>
            <span className="text-xs">{tab.label}</span>
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
