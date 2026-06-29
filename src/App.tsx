// App root — providers, navigation, and route table.

import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { FountainProvider } from './context/FountainContext'
import NavBar from './components/NavBar/NavBar'
import PrivateRoute from './components/PrivateRoute/PrivateRoute'
import Home from './pages/Home'

// Code-split the non-landing routes so the initial bundle only pays for Home
// (which itself lazy-loads the heavy Leaflet map).
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Profile = lazy(() => import('./pages/Profile'))
const Submit = lazy(() => import('./pages/Submit'))
const Recommend = lazy(() => import('./pages/Recommend'))
const About = lazy(() => import('./pages/About'))
const FountainDetail = lazy(() => import('./pages/FountainDetail'))

function RouteFallback() {
  return (
    <div
      role="status"
      className="flex min-h-[50vh] items-center justify-center text-aqua-700"
    >
      Loading…
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FountainProvider>
          <div className="flex min-h-screen flex-col">
            <a
              href="#main-content"
              className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-[1000] focus:rounded-md focus:bg-white focus:px-3 focus:py-2 focus:text-aqua-800 focus:shadow"
            >
              Skip to main content
            </a>
            <NavBar />
            <main id="main-content" className="flex-1">
              <Suspense fallback={<RouteFallback />}>
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/recommend" element={<Recommend />} />
                  <Route path="/about" element={<About />} />
                  <Route path="/fountain/:id" element={<FountainDetail />} />
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
              </Suspense>
            </main>
          </div>
        </FountainProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
