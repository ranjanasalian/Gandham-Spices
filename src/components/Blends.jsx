import { Link } from 'react-router-dom'
import { products } from '../content/siteContent'

const Blends = () => (
  <section id="blends" className="bg-white px-5 py-16 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-6xl">
      <div className="mb-8 text-center sm:mb-12">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
          Our Blends
        </p>
        <h2 className="font-display text-3xl text-charcoal sm:text-4xl">Featured Products</h2>
        <p className="mt-2 text-slate-600 sm:mt-3">
          A gallery worth savoring.
        </p>
      </div>
      <div className="grid gap-6 sm:gap-10 md:grid-cols-2">
        {products.map((product) => (
          <article
            key={product.id}
            className="group rounded-2xl border border-slate-100 bg-sand/30 p-4 shadow-sm transition hover:-translate-y-1 hover:shadow-xl sm:rounded-3xl sm:p-6"
          >
            <div className="relative mb-4 overflow-hidden rounded-xl sm:mb-6 sm:rounded-2xl">
              <img
                src={product.image}
                alt={product.name}
                className="h-48 w-full object-cover transition duration-500 group-hover:scale-105 sm:h-64"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-charcoal/60 via-transparent to-transparent" />
              <span className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-0.5 text-xs font-semibold text-charcoal sm:left-4 sm:top-4 sm:px-4 sm:py-1">
                100g
              </span>
            </div>
            <div className="space-y-1.5 text-charcoal sm:space-y-2">
              <h3 className="text-xl font-semibold sm:text-2xl">{product.name}</h3>
              <p className="text-sm text-slate-600 sm:text-base">{product.description}</p>
              <p className="text-lg font-bold text-saffron">{product.price}</p>
            </div>
            <Link
              to={product.ctaTarget}
              className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-charcoal px-6 py-3 text-sm font-semibold text-charcoal transition hover:bg-charcoal hover:text-white sm:mt-6 sm:w-auto"
            >
              {product.ctaLabel}
            </Link>
          </article>
        ))}
      </div>
    </div>
  </section>
)

export default Blends
