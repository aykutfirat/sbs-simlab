export default function Faculty() {
  return (
    <section id="faculty" className="py-24 md:py-32 bg-navy-800">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <div className="fade-up">
          <div className="gold-line mx-auto mb-8" />
          <h2 className="font-display text-3xl md:text-4xl text-cream mb-8">For Faculty</h2>

          <p className="text-cream/60 text-lg leading-relaxed mb-10">
            Have a concept that would work as a classroom simulation? SBS SimLab welcomes ideas
            from faculty across departments. We can prototype and deploy new games rapidly.
          </p>

          <a
            href="mailto:aarslan@suffolk.edu"
            className="inline-flex items-center gap-3 bg-gold hover:bg-gold-light text-navy-900
                       font-semibold px-8 py-4 rounded-lg transition-colors text-sm tracking-wide"
          >
            Propose a Simulation
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
            </svg>
          </a>

          <p className="text-cream/30 text-sm mt-8">
            Powered by the SAIL Collaborative at Sawyer Business School
          </p>
        </div>
      </div>
    </section>
  )
}
