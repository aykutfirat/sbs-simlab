import { games } from '../data/games'

const icons = {
  bagel: (
    <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <circle cx="24" cy="24" r="16" />
      <circle cx="24" cy="24" r="6" />
      <path d="M12 18c2-2 6-3 8 0M28 14c2 1 4 4 2 7M32 26c-1 3-4 5-7 4M20 34c-2-1-4-4-3-7M14 28c0-3 2-5 5-5" strokeOpacity="0.4" />
    </svg>
  ),
  beer: (
    <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="8" y="12" width="24" height="28" rx="2" />
      <path d="M32 18h6a2 2 0 012 2v8a2 2 0 01-2 2h-6" />
      <path d="M14 20v12M20 20v12M26 20v12" strokeOpacity="0.4" />
      <path d="M8 12c0-2 2-4 12-4s12 2 12 4" />
    </svg>
  ),
  airplane: (
    <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M24 4L20 20H6l-2 4h16l-2 16h4l6-16h16l2-4H28L24 4z" />
    </svg>
  ),
  pricetag: (
    <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M6 6h18l18 18-18 18L6 24V6z" />
      <circle cx="16" cy="16" r="3" />
    </svg>
  ),
  moon: (
    <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M36 24c0 8-6 14-14 14-6 0-11-3.5-13-8.5 2.5 1 5.5.5 8-1.5s4-5 3.5-8c3 .5 5.5 2 7.5 4" />
      <circle cx="32" cy="12" r="1.5" fill="currentColor" />
      <circle cx="38" cy="18" r="1" fill="currentColor" />
      <circle cx="28" cy="8" r="1" fill="currentColor" />
    </svg>
  ),
  code: (
    <svg className="w-10 h-10" viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M16 14l-10 10 10 10M32 14l10 10-10 10M28 8l-8 32" />
    </svg>
  ),
}

function GameCard({ game }) {
  const isLive = game.status === 'live'

  return (
    <div
      className={`group relative bg-navy-700/40 border rounded-xl p-8 transition-all duration-300 ${
        isLive
          ? 'border-navy-600 hover:border-gold/40 hover:-translate-y-1 hover:shadow-lg hover:shadow-gold/5'
          : 'border-navy-600/50 opacity-60'
      }`}
    >
      {/* Coming soon badge */}
      {!isLive && (
        <span className="absolute top-4 right-4 text-xs font-medium text-cream/40 bg-navy-600/50 px-3 py-1 rounded-full">
          Coming Soon
        </span>
      )}

      {/* Icon */}
      <div className={`mb-6 ${isLive ? 'text-gold' : 'text-cream/20'}`}>
        {icons[game.icon]}
      </div>

      {/* Title */}
      <h3 className={`font-display text-xl mb-3 ${isLive ? 'text-cream' : 'text-cream/40'}`}>
        {game.title}
      </h3>

      {/* Description */}
      <p className={`text-sm leading-relaxed mb-6 ${isLive ? 'text-cream/60' : 'text-cream/30'}`}>
        {game.description}
      </p>

      {/* Concept tags */}
      <div className="flex flex-wrap gap-2 mb-4">
        {game.concepts.map((concept) => (
          <span
            key={concept}
            className={`text-xs px-2.5 py-1 rounded-full ${
              isLive
                ? 'bg-navy-600/60 text-cream/50 border border-navy-600'
                : 'bg-navy-600/30 text-cream/20 border border-navy-600/30'
            }`}
          >
            {concept}
          </span>
        ))}
      </div>

      {/* Framework pills */}
      <div className="flex gap-2 mb-6">
        {game.frameworks.map((fw) => (
          <span
            key={fw}
            className={`text-xs px-2 py-0.5 rounded ${
              isLive
                ? 'bg-gold/10 text-gold/70 border border-gold/20'
                : 'bg-gold/5 text-gold/20 border border-gold/10'
            }`}
          >
            {fw}
          </span>
        ))}
      </div>

      {/* CTA */}
      {isLive ? (
        <a
          href={game.url}
          className="inline-flex items-center gap-2 text-gold font-medium text-sm group-hover:gap-3 transition-all"
        >
          Play Now
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
          </svg>
        </a>
      ) : (
        <span className="text-cream/20 text-sm">Available soon</span>
      )}
    </div>
  )
}

export default function Simulations() {
  return (
    <section id="simulations" className="py-24 md:py-32 bg-navy-900">
      <div className="max-w-6xl mx-auto px-6">
        <div className="fade-up text-center mb-16">
          <div className="gold-line mx-auto mb-8" />
          <h2 className="font-display text-3xl md:text-4xl text-cream">The Simulations</h2>
        </div>

        <div className="fade-up grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {games.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </section>
  )
}
