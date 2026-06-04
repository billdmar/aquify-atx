// App root — providers, navigation, and route table.

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FountainProvider } from './context/FountainContext'
import NavBar from './components/NavBar/NavBar'
import PrivateRoute from './components/PrivateRoute/PrivateRoute'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Profile from './pages/Profile'
import Submit from './pages/Submit'
import Recommend from './pages/Recommend'
import About from './pages/About'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FountainProvider>
          <div className="flex min-h-screen flex-col">
            <NavBar />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/recommend" element={<Recommend />} />
                <Route path="/about" element={<About />} />
                <Route
                  path="/submit"
                  element={
                    <PrivateRoute>
                      <Submit />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <PrivateRoute>
                      <Profile />
                    </PrivateRoute>
                  }
                />
                <Route
                  path="*"
                  element={
                    <div className="mx-auto max-w-3xl px-4 py-16 text-center text-slate-600">
                      <h1 className="text-3xl font-bold text-aqua-800">404</h1>
                      <p className="mt-2">That page doesn&apos;t exist.</p>
                    </div>
                  }
                />
              </Routes>
            </main>
          </div>
        </FountainProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
