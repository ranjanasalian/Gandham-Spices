import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import Home from './pages/Home.jsx'
import RecipePage from './pages/RecipePage.jsx'
import RecipesPage from './pages/RecipesPage.jsx'
import StoryPage from './pages/StoryPage.jsx'
import NotFound from './pages/NotFound.jsx'

const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/recipes',
    element: <RecipesPage />,
  },
  {
    path: '/recipes/:slug',
    element: <RecipePage />,
  },
  {
    path: '/our-story',
    element: <StoryPage />,
  },
  {
    path: '/not-found',
    element: <NotFound />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
)
