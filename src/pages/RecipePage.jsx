import { useEffect, useMemo } from 'react'
import { Navigate, useParams } from 'react-router-dom'

import Header from '../components/Header'
import Footer from '../components/Footer'
import Contact from '../components/Contact'
import RecipeDetail from '../components/RecipeDetail'
import { recipes } from '../content/siteContent'

const RecipePage = () => {
  const { slug } = useParams()

  const recipe = useMemo(
    () => recipes.find((item) => item.slug === slug),
    [slug],
  )

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [slug])

  if (!recipe) {
    return <Navigate to="/not-found" replace />
  }

  return (
    <div className="bg-gradient-to-b from-sand/30 via-white to-sand/30 text-charcoal">
      <Header />
      <main>
        <RecipeDetail recipe={recipe} />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default RecipePage
