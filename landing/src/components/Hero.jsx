export default function Hero() {
  return (
    <section className="relative min-h-screen flex flex-col justify-center items-center text-center px-6 noise-overlay overflow-hidden">
      {/* Subtle radial glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(197,150,12,0.06)_0%,_transparent_70%)]" />

      {/* Top bar */}
      <nav className="absolute top-0 left-0 right-0 flex items-center justify-between px-8 py-6 z-10">
        <div className="flex items-center gap-3">
          {/* Placeholder logo */}
          <div className="w-10 h-10 rounded bg-gold/20 border border-gold/30 flex items-center justify-center">
            <span className="text-gold font-display text-lg">S</span>
          </div>
          <div className="text-sm">
            <div className="text-cream/80 font-medium">Sawyer Business School</div>
            <div className="text-cream/40 text-xs">Suffolk University</div>
          </div>
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-cream/50">
          <a href="#vision" className="hover:text-cream transition-colors">Vision</a>
          <a href="#simulations" className="hover:text-cream transition-colors">Simulations</a>
          <a href="#classroom" className="hover:text-cream transition-colors">Classroom</a>
          <a href="#faculty" className="hover:text-cream transition-colors">Faculty</a>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 max-w-3xl">
        <div className="gold-line mx-auto mb-8" />

        <h1 className="font-display text-6xl md:text-8xl text-cream mb-4 tracking-tight">
          SBS SimLab
        </h1>

        <p className="font-display text-xl md:text-2xl text-gold mb-8">
          Where AI Literacy Meets Immersive Learning
        </p>

        <p className="text-cream/60 text-lg md:text-xl leading-relaxed max-w-2xl mx-auto mb-12">
          The Sawyer Business School is pioneering a new approach to business education &mdash;
          faculty-built, AI-powered classroom simulations that bring management theory to life.
          No licenses. No vendors. Just better learning.
        </p>

        {/* Framework badges */}
        <div className="flex justify-center gap-4 mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-gold text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
            </svg>
            IMMERSE Framework
          </span>
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gold/30 bg-gold/5 text-gold text-sm">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
            </svg>
            SAIL Framework
          </span>
        </div>
      </div>

      {/* Scroll indicator */}
      <a href="#vision" className="absolute bottom-8 z-10 text-cream/30 hover:text-cream/60 transition-colors animate-bounce">
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </a>
    </section>
  )
}
