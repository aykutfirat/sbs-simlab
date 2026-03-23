import { useState } from 'react';

interface StartScreenProps {
  onStart: (mode: 'easy' | 'medium' | 'hard', seed?: number) => void;
}

export function StartScreen({ onStart }: StartScreenProps) {
  const [mode, setMode] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [seedInput, setSeedInput] = useState('');
  const [showSeed, setShowSeed] = useState(false);

  const handleStart = () => {
    const seed = seedInput ? parseInt(seedInput, 10) : undefined;
    onStart(mode, seed);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-cream-50 to-bagel-50">
      <div className="max-w-lg w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <img src="/bagel.svg" alt="" className="w-20 h-20 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-bagel-800 mb-1">Bay Bagels</h1>
          <p className="text-lg text-bagel-600 font-medium">The Newsvendor Challenge</p>
        </div>

        {/* Story */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-bagel-100">
          <p className="text-gray-700 leading-relaxed">
            Every morning before dawn, you must place your bagel order for the day.
            Bagels are baked fresh and delivered by 6 AM. You can't reorder during the day.
            Any unsold bagels at closing time are donated (partial salvage).
            Your goal: <strong>maximize total profit over 30 days</strong>.
          </p>
        </div>

        {/* Parameters */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-bagel-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Your Economics</h2>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-green-700">$6.00</div>
              <div className="text-xs text-green-600 mt-1">Selling Price</div>
            </div>
            <div className="bg-red-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-red-700">$2.00</div>
              <div className="text-xs text-red-600 mt-1">Cost per Bagel</div>
            </div>
            <div className="bg-amber-50 rounded-lg p-3">
              <div className="text-2xl font-bold text-amber-700">$0.50</div>
              <div className="text-xs text-amber-600 mt-1">Salvage Value</div>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center italic">
            You don't know the demand distribution — you'll have to learn from experience!
          </p>
        </div>

        {/* Difficulty */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-bagel-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Difficulty</h2>
          <div className="flex gap-2">
            {(['easy', 'medium', 'hard'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`flex-1 py-2.5 px-4 rounded-lg font-medium text-sm capitalize transition-all ${
                  mode === m
                    ? 'bg-bagel-500 text-white shadow-md'
                    : 'bg-bagel-50 text-bagel-700 hover:bg-bagel-100'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2 text-center">
            {mode === 'easy' && 'Low demand variability — easier to predict.'}
            {mode === 'medium' && 'Standard demand variability.'}
            {mode === 'hard' && 'High demand variability — harder to predict.'}
          </p>

          {/* Seed (collapsible) */}
          <div className="mt-3">
            <button
              onClick={() => setShowSeed(!showSeed)}
              className="text-xs text-gray-400 hover:text-gray-600 underline"
            >
              {showSeed ? 'Hide' : 'Set'} game seed (instructor use)
            </button>
            {showSeed && (
              <input
                type="number"
                value={seedInput}
                onChange={(e) => setSeedInput(e.target.value)}
                placeholder="Enter seed number..."
                className="mt-2 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bagel-300"
              />
            )}
          </div>
        </div>

        {/* Start button */}
        <button
          onClick={handleStart}
          className="w-full py-4 bg-bagel-600 hover:bg-bagel-700 text-white font-bold text-lg rounded-xl shadow-lg hover:shadow-xl transition-all active:scale-[0.98]"
        >
          Open for Business
        </button>

        {/* Multiplayer links */}
        <div className="flex items-center justify-center gap-3 mt-5">
          <a
            href="/multiplayer/join"
            className="flex-1 py-3 text-center bg-white border-2 border-bagel-400 text-bagel-700 font-bold text-base rounded-xl hover:bg-bagel-50 transition-all active:scale-[0.98]"
          >
            Join Classroom Game
          </a>
          <a
            href="/multiplayer/create"
            className="flex-1 py-3 text-center bg-white border-2 border-bagel-400 text-bagel-700 font-bold text-base rounded-xl hover:bg-bagel-50 transition-all active:scale-[0.98]"
          >
            Instructor: Create Game
          </a>
        </div>
      </div>
    </div>
  );
}
