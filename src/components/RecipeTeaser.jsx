import { Link } from 'react-router-dom'
import { recipes } from '../content/siteContent'

const RecipeTeaser = () => {
  const featured = recipes[0]
  if (!featured) {
    return null
  }

  return (
    <section id="recipes" className="bg-white px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-6 rounded-2xl border border-slate-100 p-4 shadow-lg sm:gap-10 sm:rounded-3xl sm:p-6 md:grid-cols-2">
        <img
          src={featured.recipeHubImage || featured.heroImage}
          alt={featured.title}
          className="h-56 w-full rounded-xl object-cover sm:h-72 sm:rounded-2xl"
          loading="lazy"
        />
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
            Recipe Hub
          </p>
          <h2 className="font-display text-2xl text-charcoal sm:text-3xl">
            Biryani, Rasam & more — Go to our recipe pages.
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">
            Discover step-by-step rituals for each Gandham blend. We show you how to marinate,
            simmer, and serve with confidence.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/recipes"
              className="w-full rounded-full bg-saffron px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-saffron/30 transition hover:bg-terracotta sm:w-auto"
            >
              Find all Recipes
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default RecipeTeaser
