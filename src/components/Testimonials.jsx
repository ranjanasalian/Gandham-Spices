import { socialProof, testimonials } from '../content/siteContent'

const Testimonials = () => (
  <section className="relative overflow-hidden bg-charcoal px-5 py-16 text-white sm:px-6 sm:py-24">
    <div className="absolute inset-0 opacity-40">
      <div className="animate-float h-full w-full bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.15),_transparent_60%)]" />
    </div>
    <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-8 sm:gap-12">
      <div className="text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-sand sm:text-sm">
          Word on the Street
        </p>
        <h2 className="font-display text-3xl sm:text-4xl">Testimonials & Social Proof</h2>
        <p className="mt-2 text-sm text-slate-200 sm:mt-3 sm:text-base">
          No paid ads, just whispered secrets between spice lovers.
        </p>
      </div>
      <div className="grid gap-4 sm:gap-8 md:grid-cols-3">
        {testimonials.map((testimonial) => (
          <article
            key={testimonial.name}
            className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-2xl backdrop-blur sm:rounded-3xl sm:p-6"
          >
            <p className="text-base leading-relaxed text-slate-100 sm:text-lg">&ldquo;{testimonial.quote}&rdquo;</p>
            <div className="mt-3 text-sm font-semibold text-sand sm:mt-4">{testimonial.name}</div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-300">
              {testimonial.title}
            </p>
          </article>
        ))}
      </div>
      <div className="flex flex-col items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 text-center text-slate-100 sm:rounded-3xl sm:p-6 md:flex-row md:text-left">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-sand sm:text-sm">Instagram</p>
          <p className="text-base sm:text-lg">
            Join the slow-roast journey on{' '}
            <a
              className="font-semibold text-sand underline decoration-dotted underline-offset-4"
              href={socialProof.instagramUrl}
              target="_blank"
              rel="noreferrer"
            >
              {socialProof.instagramHandle}
            </a>
          </p>
        </div>
        <a
          href={socialProof.instagramUrl}
          target="_blank"
          rel="noreferrer"
          className="w-full rounded-full border border-white px-6 py-3 text-center text-sm font-semibold text-white transition hover:bg-white hover:text-charcoal sm:w-auto"
        >
          Follow the Fragrance
        </a>
      </div>
    </div>
  </section>
)

export default Testimonials
