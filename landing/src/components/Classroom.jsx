const testimonials = [
  {
    quote:
      'I work in retail and guessed other teams would panic and make exaggerated orders.',
    attribution: 'Student, Beer Game (Factory team)',
  },
  {
    quote:
      'We were doing so well, then orders suddenly spiked and we panicked.',
    attribution: 'Student, Beer Game',
  },
  {
    quote:
      "It's one thing to read about the bullwhip effect. It's another to watch it happen from your own decisions.",
    attribution: 'Faculty Member',
  },
]

export default function Classroom() {
  return (
    <section id="classroom" className="py-24 md:py-32 bg-navy-900">
      <div className="max-w-5xl mx-auto px-6">
        <div className="fade-up text-center mb-16">
          <div className="gold-line mx-auto mb-8" />
          <h2 className="font-display text-3xl md:text-4xl text-cream">In the Classroom</h2>
        </div>

        <div className="fade-up grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="bg-navy-800/60 border border-navy-600/50 rounded-xl p-8 relative"
            >
              {/* Quotation mark */}
              <span className="absolute top-4 left-6 font-display text-6xl text-gold/15 leading-none select-none">
                &ldquo;
              </span>

              <blockquote className="relative z-10">
                <p className="text-cream/70 text-sm leading-relaxed italic mb-6 pt-6">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <footer className="text-gold/60 text-xs font-medium">
                  &mdash; {t.attribution}
                </footer>
              </blockquote>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
