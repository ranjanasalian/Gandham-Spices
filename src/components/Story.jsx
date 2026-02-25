import { storyContent } from '../content/siteContent'

const Story = () => (
  <section
    id="story"
    className="relative bg-gradient-to-b from-white to-sand/40 px-5 py-16 text-charcoal sm:px-6 sm:py-24"
  >
    <div className="mx-auto grid max-w-6xl gap-10 sm:gap-12 md:grid-cols-2">
      <div className="space-y-5 animate-fade-in-up sm:space-y-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
          The Heart of Gandham
        </p>
        <h2 className="font-display text-3xl leading-tight sm:text-4xl">{storyContent.heading}</h2>
        <p className="text-base text-slate-600 sm:text-lg">{storyContent.meaning}</p>
        <div className="space-y-4">
          <div>
            <h3 className="text-base font-semibold text-charcoal">Small-Batch Sincerity</h3>
            <p className="text-slate-600">{storyContent.mission}</p>
          </div>
          <div>
            <h3 className="text-base font-semibold text-charcoal">Our Promise</h3>
            <p className="text-slate-600">{storyContent.promise}</p>
          </div>
        </div>
      </div>
      <div className="relative">
        <div className="absolute -inset-4 rounded-3xl bg-saffron/20 blur-3xl" />
        <img
          src={storyContent.image}
          alt="Founder roasting spices by hand"
          className="relative h-64 w-full rounded-3xl object-cover shadow-2xl sm:h-80 md:h-full"
        />
        <div className="absolute bottom-4 left-4 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-charcoal shadow sm:bottom-6 sm:left-6 sm:px-4 sm:py-2 sm:text-sm">
          Hands-on roasting
        </div>
      </div>
    </div>
  </section>
)

export default Story
