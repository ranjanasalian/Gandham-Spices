import { useEffect } from 'react'

import Header from '../components/Header'
import Contact from '../components/Contact'
import Footer from '../components/Footer'

import meaningImg from '../images/The Meaning of Gandham.png'
import whyImg from '../images/Why We Started Gandham.png'
import handsOnImg from '../images/The Hands-On Process.png'
import missionImg from '../images/Our Mission.png'

const storySections = [
  {
    title: 'The Meaning of Gandham',
    paragraphs: [
      'In Sanskrit, Gandham means "Fragrance", the aroma that connects our food to the earth.',
      'We believe that good food does not just start with taste, it begins with aroma. Freshly prepared spices bring a warmth to the home. Gandham represents our effort to bring that lost fragrance back into everyday cooking.',
    ],
    image: meaningImg,
    imageShape: 'circle',
    textFirst: true,
  },
  {
    title: 'Why We Started Gandham',
    paragraphs: [
      'We noticed that so many of us, working professionals, bachelors, and busy families, crave the warmth of a home-cooked meal but simply do not have the time or skill to roast and grind spices from scratch. Nowadays we often hear that spice powders are mixed with fillers, artificial colors, and lots of preservatives. Thinking about that, we did not want our families to eat them. We knew there had to be a better way to enjoy the food we love without compromising on what goes into our bodies.',
    ],
    image: whyImg,
    imageShape: 'square',
    textFirst: false,
  },
  {
    title: 'The Hands-On Process',
    paragraphs: [
      'Every step of this journey has been hands-on.',
      'We began crafting our own mixes at home using fresh ingredients, slow-roasted and carefully ground, just the way we cook for our own families. When they fell in love with the real aroma and depth of flavor, we felt others should have access to that same quality.',
    ],
    image: handsOnImg,
    imageShape: 'circle',
    textFirst: true,
  },
  {
    title: 'Our Mission',
    paragraphs: [
      'At Gandham, we prepare our powders in small batches to ensure they reach your kitchen fresh.',
      'Our mission is to bridge the gap by offering the richness of home-style cooking in the convenience of a 100g pouch, helping you cook delicious Biriyani, Rasam, and more without the extra effort, while still eating honest, fresh food.',
    ],
    image: missionImg,
    imageShape: 'square',
    textFirst: false,
  },
]

const StoryPage = () => {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' })
  }, [])

  return (
    <div className="bg-gradient-to-b from-sand/30 via-white to-sand/30 text-charcoal">
      <Header />
      <main className="mt-20 space-y-10 sm:space-y-16">
        <section className="px-5 pt-10 sm:px-6 sm:pt-16">
          <div className="mx-auto max-w-4xl space-y-4 text-center sm:space-y-6">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
              Why We Started Gandham Spices
            </p>
            <h1 className="font-display text-3xl leading-tight sm:text-4xl md:text-5xl">The Heart of Gandham</h1>
            <p className="text-sm text-slate-600 sm:text-base">
              From fragrance to flavour! This is the story behind every pouch, crafted to connect
              tradition with modern kitchens.
            </p>
          </div>
        </section>

        <section className="px-5 pb-8 sm:px-6 sm:pb-12">
          <div className="mx-auto flex max-w-5xl flex-col gap-10 sm:gap-16">
            {storySections.map((section, index) => (
              <article
                key={section.title}
                className={`grid gap-6 rounded-2xl border border-white/30 bg-white/70 p-4 shadow-xl shadow-slate-200/70 backdrop-blur sm:gap-8 sm:rounded-[36px] sm:p-6 md:grid-cols-2 ${section.textFirst ? '' : 'md:[&>div:first-child]:order-2'
                  }`}
              >
                <div className="space-y-3 animate-fade-in-up sm:space-y-4">
                  <div className="flex items-center gap-3 text-xs uppercase tracking-[0.4em] text-saffron sm:text-sm">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <span className="h-px flex-1 bg-saffron/40" />
                  </div>
                  <h2 className="font-display text-xl font-semibold text-charcoal sm:text-2xl">
                    {section.title}
                  </h2>
                  {section.paragraphs.map((paragraph) => (
                    <p key={paragraph} className="text-sm leading-relaxed text-slate-600 sm:text-base">
                      {paragraph}
                    </p>
                  ))}
                </div>
                <div className="flex items-center justify-center">
                  <div
                    className={`relative h-full w-full max-w-md ${section.imageShape === 'circle' ? 'aspect-square' : 'aspect-[4/3]'
                      }`}
                  >
                    <div className="absolute inset-0 translate-x-4 translate-y-4 rounded-[40px] bg-sand/60 blur-2xl" />
                    <img
                      src={section.image}
                      alt=""
                      className={`relative h-full w-full object-cover shadow-2xl transition duration-700 ${section.imageShape === 'circle' ? 'rounded-full' : 'rounded-2xl sm:rounded-[32px]'
                        }`}
                      loading="lazy"
                    />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="px-5 sm:px-6">
          <div className="mx-auto max-w-4xl rounded-2xl bg-charcoal px-6 py-8 text-center text-white shadow-2xl sm:rounded-3xl sm:px-8 sm:py-10">
            <p className="text-xs uppercase tracking-[0.4em] text-sand sm:text-sm">The Vision</p>
            <p className="mt-3 font-monarda text-base italic text-sand sm:mt-4 sm:text-xl">
              We started Gandham to bring the honest fragrance of home-style spices to busy kitchens, ensuring every family can enjoy wholesome, aromatic meals without the extra effort. Our mission is to provide the same slow-roasted, carefully ground quality we craft for our own table, conveniently packed for yours.
            </p>
          </div>
        </section>

        <Contact />
      </main>
      <Footer />
    </div>
  )
}

export default StoryPage
