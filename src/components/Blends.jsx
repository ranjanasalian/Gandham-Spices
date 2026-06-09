import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { products } from '../content/siteContent'

const Blends = () => {
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const containerRef = useRef(null)
  
  // Coordinate programmatic vs manual scrolling to avoid jumps
  const isProgrammaticScroll = useRef(false)
  const programmaticTimeoutRef = useRef(null)

  // Scroll to a specific slide index and center it
  const scrollToIndex = (index) => {
    const container = containerRef.current
    if (!container) return

    const children = Array.from(container.children)
    const targetChild = children[index]
    if (targetChild) {
      isProgrammaticScroll.current = true
      if (programmaticTimeoutRef.current) {
        clearTimeout(programmaticTimeoutRef.current)
      }

      const containerWidth = container.offsetWidth
      const targetOffset = targetChild.offsetLeft
      const targetWidth = targetChild.offsetWidth
      const scrollToLeft = targetOffset - (containerWidth - targetWidth) / 2

      container.scrollTo({
        left: scrollToLeft,
        behavior: 'smooth',
      })
      
      setActiveIndex(index)

      // Allow scroll events to determine active index again after the smooth scroll finishes
      programmaticTimeoutRef.current = setTimeout(() => {
        isProgrammaticScroll.current = false
      }, 600)
    }
  }

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (programmaticTimeoutRef.current) {
        clearTimeout(programmaticTimeoutRef.current)
      }
    }
  }, [])

  // Auto-scroll effect: advances every 5 seconds unless hovered
  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      const nextIndex = (activeIndex + 1) % products.length
      scrollToIndex(nextIndex)
    }, 5000)

    return () => clearInterval(interval)
  }, [activeIndex, isHovered])

  // Detect active slide on manual scroll/swipe
  const handleScroll = () => {
    const container = containerRef.current
    if (!container || isProgrammaticScroll.current) return

    // If all cards fit in viewport, do not snap-update activeIndex
    if (container.scrollWidth <= container.clientWidth) return

    const children = Array.from(container.children)
    if (children.length === 0) return

    const firstChild = children[0]
    const secondChild = children[1]
    
    // Calculate cardSpacing dynamically (card width + gap)
    let cardSpacing = firstChild.offsetWidth
    if (secondChild) {
      cardSpacing = secondChild.offsetLeft - firstChild.offsetLeft
    }

    // Determine the closest index based on how far we have scrolled
    const closestIndex = Math.min(
      children.length - 1,
      Math.max(0, Math.round(container.scrollLeft / cardSpacing))
    )

    if (closestIndex !== activeIndex) {
      setActiveIndex(closestIndex)
    }
  }

  const nextSlide = () => {
    const nextIndex = (activeIndex + 1) % products.length
    scrollToIndex(nextIndex)
  }

  const prevSlide = () => {
    const prevIndex = (activeIndex - 1 + products.length) % products.length
    scrollToIndex(prevIndex)
  }

  return (
    <section id="blends" className="bg-white px-4 py-16 sm:px-6 sm:py-24 overflow-hidden">
      <div className="mx-auto max-w-6xl relative">
        {/* Header */}
        <div className="mb-8 text-center sm:mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
            Our Blends
          </p>
          <h2 className="font-display text-3xl text-charcoal sm:text-4xl">Featured Products</h2>
          <p className="mt-2 text-slate-600 sm:mt-3">
            A gallery worth savoring.
          </p>
        </div>

        {/* Carousel Container */}
        <div 
          className="relative px-4 sm:px-12"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Left Navigation Arrow */}
          <button
            type="button"
            onClick={prevSlide}
            className="absolute left-1 sm:left-2 lg:left-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-100 bg-white/95 backdrop-blur-md shadow-md text-charcoal hover:bg-charcoal hover:text-white hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label="Previous product"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
            </svg>
          </button>

          {/* Right Navigation Arrow */}
          <button
            type="button"
            onClick={nextSlide}
            className="absolute right-1 sm:right-2 lg:right-4 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full border border-slate-100 bg-white/95 backdrop-blur-md shadow-md text-charcoal hover:bg-charcoal hover:text-white hover:scale-105 active:scale-95 transition-all duration-300"
            aria-label="Next product"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </button>

          {/* Scrollable track */}
          <div
            ref={containerRef}
            onScroll={handleScroll}
            className="flex gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory hide-scrollbar py-4 px-2"
            style={{ scrollPadding: '0 24px' }}
          >
            {products.map((product, idx) => {
              const isActive = idx === activeIndex
              return (
                <article
                  key={product.id}
                  className={`snap-center shrink-0 w-[88%] sm:w-[65%] md:w-[48%] lg:w-[42%] xl:w-[32%] rounded-2xl border p-4 shadow-sm transition-all duration-300 sm:rounded-3xl sm:p-6 ${
                    isActive 
                      ? 'border-orange-500 bg-white shadow-xl ring-1 ring-orange-200 opacity-100 scale-100' 
                      : 'border-slate-100 bg-sand/30 opacity-100 scale-100'
                  }`}
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
                      {product.weight}
                    </span>
                  </div>
                  <div className="space-y-1.5 text-charcoal sm:space-y-2">
                    <h3 className="text-xl font-semibold sm:text-2xl">{product.name}</h3>
                    <p className="text-sm text-slate-600 sm:text-base min-h-[3rem] line-clamp-2">{product.description}</p>
                    <p className="text-lg font-bold text-saffron">{product.price}</p>
                  </div>
                  <Link
                    to={product.ctaTarget}
                    className="mt-4 inline-flex w-full items-center justify-center rounded-full border border-charcoal px-6 py-3 text-sm font-semibold text-charcoal transition hover:bg-charcoal hover:text-white sm:mt-6 sm:w-auto"
                  >
                    {product.ctaLabel}
                  </Link>
                </article>
              )
            })}
          </div>
        </div>

        {/* Indicators / Dots */}
        <div className="mt-8 flex justify-center gap-2">
          {products.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => scrollToIndex(idx)}
              className={`h-2 rounded-full transition-all duration-300 ${
                idx === activeIndex 
                  ? 'w-6 bg-saffron' 
                  : 'w-2 bg-slate-300 hover:bg-slate-400'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Blends
