import { useState } from 'react'
import { contactContent } from '../content/siteContent'

const Contact = () => {
  const [status, setStatus] = useState('')

  const handleSubmit = (event) => {
    event.preventDefault()
    setStatus('Thanks for getting in touch! We will reply within a day.')
    event.target.reset()
  }

  return (
    <section id="contact" className="bg-white px-5 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto grid max-w-6xl gap-8 sm:gap-12 md:grid-cols-2">
        <div className="space-y-3 sm:space-y-4">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-saffron sm:text-sm">
            {contactContent.tagline}
          </p>
          <h2 className="font-display text-3xl text-charcoal sm:text-4xl">
            Let's plan your next fragrant memory.
          </h2>
          <p className="text-sm text-slate-600 sm:text-base">{contactContent.description}</p>
          <p className="text-sm font-semibold text-charcoal">
            {contactContent.addressTagline}
          </p>
        </div>
        <form
          onSubmit={handleSubmit}
          className="space-y-4 rounded-2xl border border-slate-100 bg-sand/40 p-5 shadow-lg sm:rounded-3xl sm:p-6"
        >
          <div>
            <label className="text-sm font-semibold text-charcoal" htmlFor="name">
              {contactContent.form.name}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/30 sm:rounded-2xl"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal" htmlFor="email">
              {contactContent.form.email}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/30 sm:rounded-2xl"
            />
          </div>
          <div>
            <label className="text-sm font-semibold text-charcoal" htmlFor="message">
              {contactContent.form.message}
            </label>
            <textarea
              id="message"
              name="message"
              rows="4"
              required
              className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-slate-700 focus:border-saffron focus:outline-none focus:ring-2 focus:ring-saffron/30 sm:rounded-2xl"
            />
          </div>
          <button
            type="submit"
            className="w-full rounded-full bg-terracotta px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-terracotta/30 transition hover:bg-saffron active:scale-[0.98]"
          >
            Send Inquiry
          </button>
          {status && <p className="text-sm text-saffron">{status}</p>}
        </form>
      </div>
    </section>
  )
}

export default Contact
