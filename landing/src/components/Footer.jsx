export default function Footer() {
  return (
    <footer className="border-t border-navy-600/50 bg-navy-900 py-12">
      <div className="max-w-5xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Branding */}
          <div className="text-center md:text-left">
            <div className="font-display text-lg text-cream/80">Sawyer Business School</div>
            <div className="text-cream/30 text-sm">Suffolk University, Boston</div>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-sm text-cream/40">
            <a
              href="https://www.suffolk.edu/business"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-cream/70 transition-colors"
            >
              Suffolk SBS Home
            </a>
            <span className="text-cream/10">|</span>
            <a href="#vision" className="hover:text-cream/70 transition-colors">
              IMMERSE Framework
            </a>
            <span className="text-cream/10">|</span>
            <a href="#vision" className="hover:text-cream/70 transition-colors">
              SAIL Framework
            </a>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-navy-600/30 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-cream/20 text-xs">
            &copy; 2026 Sawyer Business School, Suffolk University
          </p>
          <p className="text-cream/15 text-xs">
            SBS SimLab is a faculty initiative of the Sawyer Business School
          </p>
        </div>
      </div>
    </footer>
  )
}
