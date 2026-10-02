import { lazy } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './auth'
import { AtmosphereProvider } from './atmosphere'
import { Layout } from './components/Layout'

const HomePage = lazy(() => import('./pages/HomePage'))
const CinemaPage = lazy(() => import('./pages/CinemaPage'))
const TitlePage = lazy(() => import('./pages/TitlePage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const StarWarsPage = lazy(() => import('./pages/StarWarsPage'))
const FilmPage = lazy(() => import('./pages/FilmPage'))
const SpotifyPage = lazy(() => import('./pages/SpotifyPage'))
const BooksPage = lazy(() => import('./pages/BooksPage'))
const BookPage = lazy(() => import('./pages/BookPage'))
const CommunityPage = lazy(() => import('./pages/CommunityPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'))

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AtmosphereProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="cine" element={<CinemaPage />} />
              <Route path="cine/:imdbId" element={<TitlePage />} />
              <Route path="biblioteca" element={<LibraryPage />} />
              <Route path="star-wars" element={<StarWarsPage />} />
              <Route path="star-wars/:id" element={<FilmPage />} />
              <Route path="spotify" element={<SpotifyPage />} />
              <Route path="libros" element={<BooksPage />} />
              <Route path="libros/:id" element={<BookPage />} />
              <Route path="comunidad" element={<CommunityPage />} />
              <Route path="perfil" element={<ProfilePage />} />
              <Route path="entrar" element={<AuthPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </AtmosphereProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
