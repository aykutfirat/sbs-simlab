interface StartScreenProps {
  onStart: () => void;
}

export default function StartScreen({ onStart }: StartScreenProps) {
  return (
    <div className="min-h-screen bg-cockpit-bg flex items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">
            PEOPLE EXPRESS
          </h1>
          <h2 className="text-xl text-cockpit-accent font-light tracking-widest uppercase">
            Management Flight Simulator
          </h2>
        </div>

        <div className="bg-cockpit-panel border border-cockpit-border rounded-xl p-6 mb-8 text-left">
          <p className="text-cockpit-text mb-4 leading-relaxed">
            <strong className="text-white">People Express Airlines</strong> was a revolutionary low-cost carrier
            that launched in 1981 with just 3 aircraft and 250 employees. Under CEO Don Burr's aggressive
            growth strategy, it became the fastest-growing airline in U.S. history — expanding to
            over 80 aircraft and 4,000+ employees by 1985.
          </p>
          <p className="text-cockpit-text mb-4 leading-relaxed">
            But rapid growth outpaced the organization's ability to maintain service quality.
            Employee burnout, declining service, and fierce competitor response created a devastating
            death spiral. By 1986, People Express was acquired by Texas Air for a fraction of its
            peak value.
          </p>
          <p className="text-cockpit-muted leading-relaxed">
            <strong className="text-cockpit-warning">Your challenge:</strong> Can you manage the airline's growth
            over 10 years (40 quarters) without falling into the same traps? Make strategic decisions
            about fleet expansion, pricing, hiring, marketing, and service scope each quarter.
          </p>
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={onStart}
            className="px-8 py-3 bg-cockpit-accent hover:bg-blue-600 text-white font-semibold
                       rounded-lg text-lg transition-colors duration-200
                       shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40"
          >
            Take Command
          </button>
          <p className="text-cockpit-muted text-sm">
            Suffolk University — MIS Course
          </p>
        </div>
      </div>
    </div>
  );
}
