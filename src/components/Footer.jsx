const Footer = () => (
  <footer className="bg-charcoal px-5 py-8 text-white sm:px-6 sm:py-10">
    <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 text-center sm:gap-6 md:flex-row md:items-center md:justify-between md:text-left">
      <div>
        <p className="text-base font-semibold sm:text-lg">Gandham Spices</p>
        <p className="text-xs text-slate-300 sm:text-sm">
          Made with love in Brahmavar.
        </p>
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300 sm:gap-6 sm:text-sm">
        <a
          href="https://instagram.com/gandham.spices"
          target="_blank"
          rel="noreferrer"
          className="transition hover:text-sand"
        >
          Instagram
        </a>
        <a href="mailto:hello@gandhamspices.com" className="transition hover:text-sand">
          hello@gandhamspices.com
        </a>
        <span>© {new Date().getFullYear()}</span>
      </div>
    </div>
  </footer>
)

export default Footer
