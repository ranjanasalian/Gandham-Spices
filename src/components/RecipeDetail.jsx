import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

const highlightMix = (text) => {
  const phrase = '2½ tbsp Biryani Marination Mix'
  if (!text.includes(phrase)) return text
  const [before, after] = text.split(phrase)
  return (
    <>
      {before}
      <strong>{phrase}</strong>
      {after}
    </>
  )
}

const RecipeDetail = ({ recipe }) => (
  <section className="bg-sand/40 px-5 py-16 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-5xl space-y-8 rounded-2xl bg-white/90 p-5 shadow-2xl backdrop-blur sm:space-y-10 sm:rounded-3xl sm:p-6">
      <div className="space-y-4 text-center sm:space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
          Recipe Hub
        </p>
        <h1 className="font-display text-3xl text-charcoal sm:text-4xl">{recipe.title}</h1>
        <p className="text-sm text-slate-600 sm:text-base">{recipe.subtitle}</p>
      </div>
      <img
        src={recipe.heroImage}
        alt={recipe.title}
        className="mx-auto max-w-full rounded-2xl object-contain sm:max-w-md sm:rounded-3xl"
        loading="lazy"
      />
      <div className="grid gap-8 sm:gap-10 md:grid-cols-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
            Ingredients
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm text-slate-700 sm:mt-4 sm:text-base">
            {recipe.ingredients.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
        <div>
          {recipe.steps ? (
            <>
              <h2 className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
                Directions
              </h2>
              <ol className="mt-3 list-decimal space-y-3 pl-5 text-sm text-slate-700 sm:mt-4 sm:text-base">
                {recipe.steps.map((step) => (
                  <li key={step} className="leading-relaxed">
                    {highlightMix(step)}
                  </li>
                ))}
              </ol>
            </>
          ) : (
            <div className="rounded-2xl bg-sand/60 p-5 text-sm text-slate-600 sm:rounded-3xl sm:p-6 sm:text-base">
              {recipe.placeholder}
            </div>
          )}
        </div>
      </div>
      <div className="flex flex-col items-center gap-3 rounded-2xl bg-sand/60 px-5 py-4 text-sm text-slate-600 sm:flex-row sm:flex-wrap sm:justify-between sm:gap-4 sm:rounded-3xl sm:px-6">
        <span>Blend: {recipe.name ?? 'Gandham Signature Blend'}</span>
        <Link
          to={`/recipes#${recipe.slug}`}
          className="group inline-flex w-full items-center justify-center gap-2 rounded-full border border-orange-500 px-6 py-2.5 font-semibold text-orange-500 transition duration-300 hover:bg-orange-500 hover:text-white sm:w-auto"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Back to All Recipes
        </Link>
      </div>
    </div>
  </section>
)

RecipeDetail.propTypes = {
  recipe: PropTypes.shape({
    title: PropTypes.string.isRequired,
    subtitle: PropTypes.string,
    heroImage: PropTypes.string.isRequired,
    ingredients: PropTypes.arrayOf(PropTypes.string).isRequired,
    steps: PropTypes.arrayOf(PropTypes.string),
    placeholder: PropTypes.string,
    name: PropTypes.string,
  }).isRequired,
}

export default RecipeDetail
