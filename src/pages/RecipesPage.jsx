import { useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { recipes } from '../content/siteContent'
import Header from '../components/Header'
import Footer from '../components/Footer'

const RecipesPage = () => {
  const location = useLocation()

  useEffect(() => {
    const hash = (location.hash || '').replace('#', '')
    if (hash) {
      // Coming from a recipe detail — scroll to that recipe's card
      const timeout = setTimeout(() => {
        const el = document.getElementById(`recipe-${hash}`)
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
      }, 100)
      return () => clearTimeout(timeout)
    } else {
      // Normal navigation — scroll to top
      window.scrollTo({ top: 0, behavior: 'instant' })
    }
  }, [location.hash])

  return (
    <div className="bg-gradient-to-b from-sand/30 via-white to-sand/30 text-charcoal">
      <Header />
      <main className="flex flex-col gap-0">
        <section className="px-5 py-16 sm:px-6 sm:py-24">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center sm:mb-12">
              <h1 className="font-display text-3xl font-semibold text-charcoal sm:text-4xl">
                Our Recipes
              </h1>
              <p className="mt-3 text-sm text-slate-600 sm:mt-4 sm:text-base">
                Discover step-by-step rituals for each Gandham blend. Learn how to marinate,
                simmer, and serve with confidence.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-6 lg:grid-cols-4">
              {recipes.map((recipe) => (
                <Link
                  key={recipe.id}
                  id={`recipe-${recipe.slug}`}
                  to={`/recipes/${recipe.slug}`}
                  className="group flex flex-col overflow-hidden rounded-xl bg-white transition duration-300 hover:shadow-xl sm:rounded-lg"
                  style={{
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <div className="relative overflow-hidden bg-slate-100">
                    <img
                      src={recipe.heroImage}
                      alt={recipe.title}
                      className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="flex flex-1 flex-col justify-between space-y-3 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-charcoal line-clamp-2 group-hover:text-orange-500 transition">
                        {recipe.title}
                      </h3>
                      <p className="mt-1 text-xs text-slate-500 line-clamp-2">
                        {recipe.subtitle}
                      </p>
                    </div>
                    <button
                      className="mt-2 w-full rounded-md bg-gradient-to-r from-saffron to-orange-500 py-2.5 text-xs font-semibold text-white transition duration-300 hover:shadow-md hover:shadow-saffron/40"
                    >
                      View Recipe
                    </button>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

export default RecipesPage
