import { useNavigate } from 'react-router-dom'
import { heroContent } from '../content/siteContent'

const Hero = () => {
  const { headline, ctaLabel, media } = heroContent
  const navigate = useNavigate()

  const handleDiscoverStory = () => {
    navigate('/our-story')
  }

  return (
    <section
      id="hero"
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-charcoal text-white"
    >
      {media?.type === 'video' ? (
        <video
          className="absolute inset-0 h-full w-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          poster={media.poster}
        >
          <source src={media.src} type="video/mp4" />
        </video>
      ) : (
        <img
          src={media?.src}
          alt="Spices in motion"
          className="absolute inset-0 h-full w-full object-cover"
          fetchPriority="high"
        />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-charcoal/80" />

      <div className="relative z-10 mx-auto flex max-w-4xl flex-col items-center gap-5 px-5 text-center sm:gap-6 sm:px-6">
        <p className="rounded-full border border-white/30 px-4 py-1 text-[10px] uppercase tracking-[0.3em] text-sand sm:text-xs">
          Handpicked · Dry Roasted · Ground
        </p>
        <h1 className="font-display text-3xl leading-tight sm:text-4xl md:text-5xl lg:text-6xl">
          {headline}
        </h1>
        <p className="max-w-lg text-base font-display italic text-slate-200 sm:text-lg">
          From Our Home to Yours, Handcrafted with care.
        </p>
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
          <a
            href="#blends"
            className="rounded-full bg-saffron px-8 py-3.5 text-sm font-semibold text-white shadow-lg shadow-black/30 transition-all duration-300 hover:bg-terracotta hover:shadow-xl sm:text-base"
          >
            {ctaLabel}
          </a>
          <button
            type="button"
            onClick={handleDiscoverStory}
            className="rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all duration-300 hover:border-sand hover:text-sand sm:text-base"
          >
            Discover Our Story
          </button>
        </div>
      </div>
    </section>
  )
}

export default Hero
