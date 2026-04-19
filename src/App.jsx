import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navigation from './components/Navigation'
import HomePage from './pages/HomePage'
import HexagramsPage from './pages/HexagramsPage'
import HexagramDetailPage from './pages/HexagramDetailPage'
import DivinationPage from './pages/DivinationPage'
import LibraryPage from './pages/LibraryPage'
import ProfilePage from './pages/ProfilePage'
import { API } from './api/client'

export default function App() {
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
      setUserData({
        learned: progress.learned || [],
        memorized: progress.memorized || [],
        favorites: favorites || []
      })
    } catch (e) {
      console.log('Using local storage fallback')
    }
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-primary pb-16">
        <Routes>
          <Route path="/" element={<HomePage userData={userData} />} />
          <Route path="/hexagrams" element={<HexagramsPage userData={userData} onUpdate={loadUserData} />} />
          <Route path="/hexagrams/:id" element={<HexagramDetailPage userData={userData} onUpdate={loadUserData} />} />
          <Route path="/divination" element={<DivinationPage />} />
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/profile" element={<ProfilePage userData={userData} onUpdate={loadUserData} />} />
        </Routes>
        <Navigation />
      </div>
    </BrowserRouter>
  )
}
