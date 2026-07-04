import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './components/AuthProvider'
import Navigation from './components/Navigation'
import HomePage from './pages/HomePage'
import HexagramsPage from './pages/HexagramsPage'
import HexagramDetailPage from './pages/HexagramDetailPage'
import DivinationPage from './pages/DivinationPage'
import LibraryPage from './pages/LibraryPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import { API } from './api/client'
import {
  getCachedProgress,
  cacheProgress,
  getCachedFavorites,
  cacheFavorites,
} from './api/localCache'

function AppContent() {
  const location = useLocation()
  const [userData, setUserData] = useState({
    learned: [],
    memorized: [],
    favorites: []
  })

  useEffect(() => {
    loadUserData()
  }, [])

  async function loadUserData() {
    try {
      const [progress, favorites] = await Promise.all([
        API.Progress.get(),
        API.Favorites.get()
      ])
      const next = {
        learned: progress.learned || [],
        memorized: progress.memorized || [],
        favorites: favorites || []
      }
      setUserData(next)
      // 成功时同步写一份本地缓存，作为后续断网兜底
      cacheProgress({ learned: next.learned, memorized: next.memorized })
      cacheFavorites(next.favorites)
    } catch (e) {
      // 网络失败时，回退到本地缓存，避免学习进度"看起来归零"
      console.log('API 不可达，使用本地缓存兜底')
      const p = getCachedProgress()
      setUserData({
        learned: p.learned || [],
        memorized: p.memorized || [],
        favorites: getCachedFavorites() || []
      })
    }
  }

  const hideNav = location.pathname === '/login'

  return (
    <div className="min-h-screen bg-primary pb-16">
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<HomePage userData={userData} />} />
        <Route path="/hexagrams" element={<HexagramsPage userData={userData} onUpdate={loadUserData} />} />
        <Route path="/hexagrams/:id" element={<HexagramDetailPage userData={userData} onUpdate={loadUserData} />} />
        <Route path="/divination" element={<DivinationPage userData={userData} onUpdate={loadUserData} />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/profile" element={<ProfilePage userData={userData} onUpdate={loadUserData} />} />
      </Routes>
      {!hideNav && <Navigation />}
    </div>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  )
}
