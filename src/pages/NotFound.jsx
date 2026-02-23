import { Link } from 'react-router-dom'
import Header from '../components/Header'
import Footer from '../components/Footer'

const NotFound = () => (
  <div className="flex min-h-screen flex-col bg-gradient-to-b from-sand/30 via-white to-sand/30 text-charcoal">
    <Header />
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-5 text-center sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
        404
      </p>
      <h1 className="mt-3 font-display text-3xl sm:mt-4 sm:text-4xl">We lost the fragrance on this page.</h1>
      <p className="mt-3 text-sm text-slate-600 sm:mt-4 sm:text-base">
        The recipe or story you were looking for has drifted away. Let's get you back to the blends.
      </p>
      <div className="mt-6 flex w-full flex-col gap-3 sm:mt-8 sm:w-auto sm:flex-row sm:gap-4">
        <Link
          to="/"
          className="rounded-full bg-saffron px-6 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-saffron/30 transition hover:bg-terracotta"
        >
          Return Home
        </Link>
        <Link
          to="/recipes/biryani"
          className="rounded-full border border-charcoal px-6 py-3 text-center text-sm font-semibold text-charcoal transition hover:bg-charcoal hover:text-white"
        >
          Biryani Recipe
        </Link>
      </div>
    </main>
    <Footer />
  </div>
)

export default NotFound
