export default function Vision() {
  return (
    <section id="vision" className="py-24 md:py-32 bg-navy-800">
      <div className="max-w-4xl mx-auto px-6">
        <div className="fade-up">
          <div className="gold-line mb-8" />
          <h2 className="font-display text-3xl md:text-4xl text-cream mb-8">The Vision</h2>

          <div className="space-y-6 text-cream/70 text-lg leading-relaxed mb-12">
            <p>
              For decades, business schools have relied on expensive, vendor-locked simulations &mdash;
              rigid software that rarely aligns with how faculty actually teach. The result: compromises
              in pedagogy, and enormous costs passed to students.
            </p>
            <p>
              With AI-assisted development, a single faculty member can now build custom,
              curriculum-aligned simulations in days. Not months. Not with a development team.
              Just a professor with a pedagogical vision and the right tools.
            </p>
            <p>
              Suffolk&rsquo;s Sawyer Business School is leading this shift &mdash; building a free,
              open library of classroom simulations aligned with the IMMERSE and SAIL frameworks.
            </p>
          </div>
        </div>

        {/* Framework cards */}
        <div className="fade-up grid md:grid-cols-2 gap-6 mt-12">
          <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
              </svg>
              <h3 className="font-display text-xl text-cream">IMMERSE</h3>
            </div>
            <p className="text-cream/60 leading-relaxed">
              Immersive, structured learning experiences that prepare students for real-world
              complexity. Each simulation recreates the pressures, trade-offs, and delayed feedback
              loops that define actual business decisions.
            </p>
          </div>

          <div className="bg-navy-700/50 border border-navy-600 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-4">
              <svg className="w-6 h-6 text-gold" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
              </svg>
              <h3 className="font-display text-xl text-cream">SAIL</h3>
            </div>
            <p className="text-cream/60 leading-relaxed">
              Social Intelligence, AI Literacy, Innovation, Leadership &mdash; developing the
              judgment skills for an AI-augmented world. These are the capabilities that
              distinguish leaders from operators.
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}
