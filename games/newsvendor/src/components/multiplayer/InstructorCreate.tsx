import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInstructorSocket } from '../../hooks/useInstructorSocket';
import { DIFFICULTY_PRESETS } from '../../engine/constants';

export function InstructorCreate() {
  const navigate = useNavigate();
  const { connected, createGame } = useInstructorSocket();
  const [mode, setMode] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [advanceMode, setAdvanceMode] = useState<'manual' | 'timer' | 'auto'>('manual');
  const [timerDuration, setTimerDuration] = useState(30);
  const [seedInput, setSeedInput] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    setError('');

    const preset = DIFFICULTY_PRESETS[mode];
    const seed = seedInput ? parseInt(seedInput, 10) : undefined;

    const result = await createGame({
      config: {
        ...preset,
        mode,
        seed: seed || 0,
      },
      advanceMode,
      timerDuration,
      password: password || undefined,
    });

    if (result.success && result.gameCode) {
      // Store for rejoin
      sessionStorage.setItem('nvg_instructor', JSON.stringify({
        gameCode: result.gameCode,
        password: password || '',
      }));
      navigate(`/multiplayer/instructor/${result.gameCode}`);
    } else {
      setError(result.error || 'Failed to create game');
    }
    setCreating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-6">
          <img src="/bagel.svg" alt="" className="w-16 h-16 mx-auto mb-3" />
          <h1 className="text-3xl font-bold text-bagel-800">Create Classroom Game</h1>
          <p className="text-bagel-600 mt-1">Set up Bay Bagels for your class</p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 space-y-5 border border-bagel-100">
          {/* Connection status */}
          <div className="flex items-center gap-2 text-sm">
            <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-gray-500">{connected ? 'Connected to server' : 'Connecting...'}</span>
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Difficulty</label>
            <div className="flex gap-2">
              {(['easy', 'medium', 'hard'] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={`flex-1 py-2 px-3 rounded-lg font-medium text-sm capitalize transition-all ${
                    mode === m
                      ? 'bg-bagel-500 text-white shadow'
                      : 'bg-bagel-50 text-bagel-700 hover:bg-bagel-100'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-400 mt-1">
              {mode === 'easy' && 'σ=15 — Low variability'}
              {mode === 'medium' && 'σ=30 — Standard variability'}
              {mode === 'hard' && 'σ=45 — High variability'}
            </p>
          </div>

          {/* Advance Mode */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Round Advancement</label>
            <div className="space-y-2">
              {[
                { value: 'manual' as const, label: 'Manual', desc: 'You control when to reveal demand and advance rounds' },
                { value: 'timer' as const, label: 'Timer', desc: 'Auto-advance after countdown expires' },
                { value: 'auto' as const, label: 'Auto', desc: 'Advance as soon as all students submit' },
              ].map((opt) => (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                    advanceMode === opt.value
                      ? 'border-bagel-400 bg-bagel-50'
                      : 'border-gray-200 hover:border-bagel-200'
                  }`}
                >
                  <input
                    type="radio"
                    name="advanceMode"
                    value={opt.value}
                    checked={advanceMode === opt.value}
                    onChange={() => setAdvanceMode(opt.value)}
                    className="mt-0.5 accent-bagel-500"
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                    <div className="text-xs text-gray-500">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>

            {advanceMode === 'timer' && (
              <div className="mt-3">
                <label className="text-xs text-gray-500">Seconds per phase</label>
                <input
                  type="number"
                  min={10}
                  max={120}
                  value={timerDuration}
                  onChange={(e) => setTimerDuration(parseInt(e.target.value, 10) || 30)}
                  className="mt-1 w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bagel-300"
                />
              </div>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Instructor Password <span className="font-normal text-gray-400">(if set on server)</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Leave blank if not required"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bagel-300"
            />
          </div>

          {/* Seed */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Game Seed <span className="font-normal text-gray-400">(optional)</span>
            </label>
            <input
              type="number"
              value={seedInput}
              onChange={(e) => setSeedInput(e.target.value)}
              placeholder="Leave blank for today's date"
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-bagel-300"
            />
          </div>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 rounded-lg p-3">{error}</div>
          )}

          <button
            onClick={handleCreate}
            disabled={!connected || creating}
            className="w-full py-3 bg-bagel-600 hover:bg-bagel-700 text-white font-bold rounded-lg shadow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {creating ? 'Creating...' : 'Create Game'}
          </button>
        </div>

        <div className="text-center mt-4">
          <a href="/" className="text-sm text-bagel-600 hover:text-bagel-700 underline">
            ← Back to single player
          </a>
        </div>
      </div>
    </div>
  );
}
