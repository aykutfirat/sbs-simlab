import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ZAxis, LineChart, Line, Legend, BarChart, Bar, Cell } from 'recharts';
import { formatMoney, formatPrice } from '../../utils/formatting';
import { FIRM_COLORS } from '../../types';
import type { InstructorState, GameConfig, InfoMode, AIStrategy } from '../../types';

export default function Dashboard() {
  const navigate = useNavigate();
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [state, setState] = useState<InstructorState | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [config, setConfig] = useState<GameConfig>({
    totalRounds: 16,
    teamCount: 4,
    timerSeconds: 0,
    infoMode: 'fog',
    enableEvents: true,
    aiBots: [],
  });

  useEffect(() => {
    if (sessionStorage.getItem('pricingWarInstructorAuth') === 'true') setAuthenticated(true);
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    socket.connect();
    socket.on('instructor-state', (s: InstructorState) => setState(s));
    return () => { socket.off('instructor-state'); socket.disconnect(); };
  }, [authenticated]);

  const verifyPw = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setVerifying(true); setAuthError('');
    try {
      const res = await fetch('/pricing-war/api/verify-password', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.success) { sessionStorage.setItem('pricingWarInstructorAuth', 'true'); setAuthenticated(true); }
      else setAuthError('Invalid password');
    } catch { setAuthError('Failed to verify'); }
    setVerifying(false);
  }, [password]);

  const createGame = useCallback(() => {
    setCreating(true); setError('');
    socket.emit('create-game', config, (res: any) => {
      setCreating(false);
      if (!res.success) setError(res.error || 'Failed to create');
    });
  }, [config]);

  const startGame = useCallback(() => {
    if (!state) return;
    socket.emit('start-game', state.code, (res: any) => { if (!res.success) setError(res.error); });
  }, [state]);

  const advanceRound = useCallback(() => {
    if (!state) return;
    socket.emit('advance-round', state.code, (res: any) => { if (!res.success) setError(res.error); });
  }, [state]);

  const triggerEvent = useCallback((eventType: string) => {
    if (!state) return;
    socket.emit('trigger-event', { code: state.code, eventType }, (res: any) => { if (!res.success) setError(res.error); });
  }, [state]);

  const changeInfoMode = useCallback((mode: InfoMode) => {
    if (!state) return;
    socket.emit('change-info-mode', { code: state.code, mode }, (res: any) => { if (!res.success) setError(res.error); });
  }, [state]);

  const endGame = useCallback(() => {
    if (!state) return;
    if (!confirm('End game and go to debrief?')) return;
    socket.emit('end-game', state.code, (res: any) => { if (!res.success) setError(res.error); });
  }, [state]);

  const resetGame = useCallback(() => {
    if (!state) return;
    if (!confirm('Reset game? All data will be lost.')) return;
    socket.emit('reset-game', state.code, (res: any) => { if (!res.success) setError(res.error); });
  }, [state]);

  const openDebrief = useCallback(() => {
    if (!state) return;
    window.open(`/pricing-war/debrief/${state.code}`, '_blank');
  }, [state]);

  const addAIBot = useCallback((strategy: AIStrategy) => {
    setConfig(c => ({
      ...c,
      aiBots: [...c.aiBots, { strategy, firmName: `AI-${strategy}-${c.aiBots.length + 1}` }],
    }));
  }, []);

  // Password gate
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-6">
          <button onClick={() => navigate('/')} className="text-war-muted hover:text-war-text text-sm">← Back</button>
          <div className="text-center">
            <div className="text-4xl mb-2">🔒</div>
            <h1 className="text-2xl font-bold text-war-text">Instructor Access</h1>
          </div>
          <form onSubmit={verifyPw} className="space-y-4">
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Enter password"
              className="w-full px-4 py-3 bg-war-panel border border-war-border rounded-lg text-war-text focus:outline-none focus:border-war-accent" autoFocus />
            {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
            <button type="submit" disabled={verifying} className="w-full py-3 bg-war-accent hover:bg-indigo-600 text-white font-bold rounded-lg disabled:opacity-50">
              {verifying ? 'Verifying...' : 'Continue'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Create game form
  if (!state) {
    return (
      <div className="min-h-screen p-6">
        <div className="max-w-lg mx-auto space-y-6">
          <button onClick={() => navigate('/')} className="text-war-muted hover:text-war-text text-sm">← Back</button>
          <div className="text-center">
            <div className="text-4xl mb-2">⚔️</div>
            <h1 className="text-2xl font-bold text-war-text">Create Pricing War</h1>
            <p className="text-war-muted text-sm mt-1">CloudWars — Oligopoly pricing simulation</p>
          </div>
          <div className="bg-war-panel border border-war-border rounded-lg p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-war-muted mb-1">Max Teams</label>
                <select value={config.teamCount} onChange={e => setConfig(c => ({ ...c, teamCount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-war-bg border border-war-border rounded-lg text-war-text">
                  {[3, 4, 5, 6].map(n => <option key={n} value={n}>{n} teams</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm text-war-muted mb-1">Total Rounds</label>
                <select value={config.totalRounds} onChange={e => setConfig(c => ({ ...c, totalRounds: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-war-bg border border-war-border rounded-lg text-war-text">
                  {[8, 12, 16, 20].map(n => <option key={n} value={n}>{n} rounds</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-war-muted mb-1">Round Timer</label>
                <select value={config.timerSeconds} onChange={e => setConfig(c => ({ ...c, timerSeconds: Number(e.target.value) }))}
                  className="w-full px-3 py-2 bg-war-bg border border-war-border rounded-lg text-war-text">
                  <option value={0}>No timer (manual)</option>
                  <option value={60}>60 seconds</option>
                  <option value={90}>90 seconds</option>
                  <option value={120}>2 minutes</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-war-muted mb-1">Info Mode</label>
                <select value={config.infoMode} onChange={e => setConfig(c => ({ ...c, infoMode: e.target.value as InfoMode }))}
                  className="w-full px-3 py-2 bg-war-bg border border-war-border rounded-lg text-war-text">
                  <option value="fog">Fog of War</option>
                  <option value="full">Full Transparency</option>
                  <option value="dark">Dark Mode</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-war-text cursor-pointer">
                <input type="checkbox" checked={config.enableEvents} onChange={e => setConfig(c => ({ ...c, enableEvents: e.target.checked }))}
                  className="rounded" />
                Enable random market events
              </label>
            </div>
            {/* AI Bots */}
            <div>
              <label className="block text-sm text-war-muted mb-2">AI Bot Competitors (optional)</label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(['nash', 'predator', 'tit-for-tat', 'random'] as AIStrategy[]).map(s => (
                  <button key={s} onClick={() => addAIBot(s)}
                    className="px-3 py-1.5 bg-war-bg border border-war-border rounded-lg text-xs text-war-muted hover:text-war-text hover:border-war-accent transition-colors">
                    + {s}
                  </button>
                ))}
              </div>
              {config.aiBots.length > 0 && (
                <div className="space-y-1">
                  {config.aiBots.map((bot, i) => (
                    <div key={i} className="flex items-center justify-between text-sm bg-war-bg px-3 py-1.5 rounded">
                      <span className="text-war-text">🤖 {bot.firmName} ({bot.strategy})</span>
                      <button onClick={() => setConfig(c => ({ ...c, aiBots: c.aiBots.filter((_, j) => j !== i) }))}
                        className="text-red-400/50 hover:text-red-400 text-xs">✕</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          {error && <p className="text-red-400 text-sm text-center">{error}</p>}
          <button onClick={createGame} disabled={creating}
            className="w-full py-3 bg-war-accent hover:bg-indigo-600 text-white font-bold rounded-lg disabled:opacity-50">
            {creating ? 'Creating...' : 'Create Game'}
          </button>
        </div>
      </div>
    );
  }

  // ── Live Dashboard ────────────────────────────────────────

  const firms = Object.values(state.firms);
  const humanFirms = firms.filter(f => !f.isAI);
  const activeFirms = firms.filter(f => !f.bankrupt);


  // Bubble chart data: price vs quality, size = market share
  const bubbleData = activeFirms.map((f, i) => ({
    x: f.price,
    y: f.quality,
    z: Math.max(f.marketShare * 500, 20),
    name: `${f.icon} ${f.name}`,
    fill: FIRM_COLORS[i % FIRM_COLORS.length],
  }));

  // Price history line data
  const maxRounds = Math.max(...firms.map(f => f.history.length), 0);
  const priceHistoryData = Array.from({ length: maxRounds }, (_, r) => {
    const point: any = { round: r + 1 };
    firms.forEach(f => {
      if (f.history[r]) point[f.name] = f.history[r].price;
    });
    return point;
  });

  // Profit leaderboard
  const leaderboard = [...firms].sort((a, b) => b.cumulativeProfit - a.cumulativeProfit);

  return (
    <div className="min-h-screen p-4 bg-war-bg">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-war-text flex items-center gap-2">
              ⚔️ Pricing War Arena
              <span className="text-sm font-mono bg-war-accent/20 text-war-accent px-3 py-1 rounded-lg border border-war-accent/30">{state.code}</span>
            </h1>
            <p className="text-war-muted text-sm">
              Round {state.round}/{state.config.totalRounds} · Phase: <span className="text-war-text capitalize">{state.phase}</span>
              · Info: <span className="text-war-text">{state.infoMode}</span>
              · {humanFirms.length} teams + {firms.length - humanFirms.length} AI
            </p>
          </div>
          {state.timerRemaining !== null && (
            <span className="font-mono text-war-accent bg-war-panel px-3 py-1 rounded-lg border border-war-border">
              {Math.floor(state.timerRemaining / 60)}:{(state.timerRemaining % 60).toString().padStart(2, '0')}
            </span>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-700/40 text-red-400 px-4 py-2 rounded-lg text-sm">
            {error} <button onClick={() => setError('')} className="ml-2 underline">dismiss</button>
          </div>
        )}

        {/* Controls */}
        <div className="bg-war-panel border border-war-border rounded-lg p-4">
          <div className="flex items-center gap-3 flex-wrap">
            {state.phase === 'lobby' && (
              <button onClick={startGame} disabled={humanFirms.length === 0}
                className="px-4 py-2 bg-war-accent hover:bg-indigo-600 text-white rounded-lg text-sm font-bold disabled:opacity-50">
                Start Game →
              </button>
            )}
            {state.phase === 'playing' && (
              <>
                <span className="text-war-muted text-sm">
                  {activeFirms.filter(f => !f.isAI && f.decisions !== null).length}/{humanFirms.filter(f => !f.bankrupt).length} teams submitted
                </span>
                <button onClick={advanceRound}
                  className="px-4 py-2 bg-war-accent hover:bg-indigo-600 text-white rounded-lg text-sm font-bold">
                  Resolve Round →
                </button>
              </>
            )}
            {state.phase === 'round-results' && (
              <button onClick={advanceRound}
                className="px-4 py-2 bg-war-accent hover:bg-indigo-600 text-white rounded-lg text-sm font-bold">
                {state.round >= state.config.totalRounds ? 'Go to Debrief →' : 'Next Round →'}
              </button>
            )}
            {state.phase === 'debrief' && (
              <button onClick={openDebrief} className="px-4 py-2 bg-war-blue hover:bg-blue-600 text-white rounded-lg text-sm font-medium">
                Open Debrief View ↗
              </button>
            )}

            <div className="flex-1" />

            {/* Info mode switcher */}
            {state.phase !== 'lobby' && (
              <div className="flex items-center gap-1 text-xs">
                {(['fog', 'full', 'dark'] as InfoMode[]).map(m => (
                  <button key={m} onClick={() => changeInfoMode(m)}
                    className={`px-2 py-1 rounded ${state.infoMode === m ? 'bg-war-accent text-white' : 'bg-war-bg text-war-muted hover:text-war-text border border-war-border'}`}>
                    {m === 'fog' ? '🌫️ Fog' : m === 'full' ? '👁️ Full' : '🌑 Dark'}
                  </button>
                ))}
              </div>
            )}

            {/* Event triggers */}
            {state.phase === 'playing' && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-war-muted mr-1">Events:</span>
                {[
                  { type: 'recession', label: '📉' },
                  { type: 'new-entrant-rumor', label: '🏭' },
                  { type: 'tech-breakthrough', label: '🔬' },
                  { type: 'viral-review', label: '⭐' },
                  { type: 'data-breach', label: '🔓' },
                  { type: 'price-transparency', label: '📊' },
                ].map(ev => (
                  <button key={ev.type} onClick={() => triggerEvent(ev.type)} title={ev.type}
                    className="w-8 h-8 bg-war-bg border border-war-border rounded-lg text-sm hover:border-war-accent transition-colors">
                    {ev.label}
                  </button>
                ))}
              </div>
            )}

            <button onClick={endGame} className="px-3 py-1.5 text-war-orange hover:bg-orange-900/20 rounded-lg text-xs border border-orange-800/40">End Game</button>
            <button onClick={resetGame} className="px-3 py-1.5 text-red-400 hover:bg-red-900/20 rounded-lg text-xs border border-red-800/40">Reset</button>
          </div>
        </div>

        {/* Active events */}
        {state.events.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {state.events.map((ae, i) => (
              <span key={i} className="bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-1 text-sm text-orange-300">
                ⚡ {ae.event.name} ({ae.remainingRounds}r left)
              </span>
            ))}
          </div>
        )}

        {/* Main grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Market Map (bubble chart) */}
          <div className="bg-war-panel border border-war-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-war-text mb-2">Market Map — Price vs Quality</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 10, right: 10, bottom: 10, left: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="x" name="Price" type="number" domain={[6, 32]} stroke="#94a3b8" fontSize={11}
                    label={{ value: 'Price ($)', position: 'insideBottom', offset: -5, fill: '#94a3b8', fontSize: 11 }} />
                  <YAxis dataKey="y" name="Quality" type="number" domain={[0, 100]} stroke="#94a3b8" fontSize={11}
                    label={{ value: 'Quality', angle: -90, position: 'insideLeft', fill: '#94a3b8', fontSize: 11 }} />
                  <ZAxis dataKey="z" range={[40, 400]} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(value: number, name: string) => [name === 'x' ? formatPrice(value) : value.toFixed(1), name === 'x' ? 'Price' : 'Quality']} />
                  {bubbleData.map((d, i) => (
                    <Scatter key={i} name={d.name} data={[d]} fill={d.fill} />
                  ))}
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Profit Leaderboard */}
          <div className="bg-war-panel border border-war-border rounded-lg p-4">
            <h3 className="text-sm font-medium text-war-text mb-2">Profit Leaderboard</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={leaderboard.map((f) => ({
                  name: `${f.icon} ${f.name}`,
                  profit: f.cumulativeProfit,
                  fill: FIRM_COLORS[firms.indexOf(f) % FIRM_COLORS.length],
                }))} layout="vertical" margin={{ top: 0, right: 20, bottom: 0, left: 100 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis type="number" stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => formatMoney(v)} />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={95} />
                  <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }}
                    formatter={(v: number) => formatMoney(v)} />
                  <Bar dataKey="profit" radius={[0, 4, 4, 0]}>
                    {leaderboard.map((f, i) => (
                      <Cell key={i} fill={FIRM_COLORS[firms.indexOf(f) % FIRM_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Price History */}
          {priceHistoryData.length > 0 && (
            <div className="bg-war-panel border border-war-border rounded-lg p-4 lg:col-span-2">
              <h3 className="text-sm font-medium text-war-text mb-2">Price History</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={priceHistoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="round" stroke="#94a3b8" fontSize={11} />
                    <YAxis domain={[6, 32]} stroke="#94a3b8" fontSize={11} tickFormatter={(v: number) => `$${v}`} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #1e293b', borderRadius: '8px', color: '#e2e8f0' }} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    {firms.map((f, i) => (
                      <Line key={f.id} type="monotone" dataKey={f.name} stroke={FIRM_COLORS[i % FIRM_COLORS.length]} strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>

        {/* Firm cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {firms.map(f => (
            <div key={f.id} className={`bg-war-panel border rounded-lg p-3 ${f.bankrupt ? 'border-red-800/40 opacity-50' : 'border-war-border'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{f.icon}</span>
                <div>
                  <p className="text-sm font-medium text-war-text">{f.name}</p>
                  <p className="text-[10px] text-war-muted">{f.isAI ? '🤖 AI' : f.members.join(', ') || 'No members'}</p>
                </div>
              </div>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between"><span className="text-war-muted">Price</span><span className="text-war-text">{formatPrice(f.price)}</span></div>
                <div className="flex justify-between"><span className="text-war-muted">Quality</span><span className="text-war-text">{f.quality.toFixed(0)}</span></div>
                <div className="flex justify-between"><span className="text-war-muted">Brand</span><span className="text-war-text">{(f.brand * 100).toFixed(0)}%</span></div>
                <div className="flex justify-between"><span className="text-war-muted">Share</span><span className="text-war-text">{(f.marketShare * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between">
                  <span className="text-war-muted">Profit</span>
                  <span className={f.cumulativeProfit >= 0 ? 'text-war-green' : 'text-war-red'}>{formatMoney(f.cumulativeProfit)}</span>
                </div>
                {state.phase === 'playing' && !f.isAI && (
                  <div className="pt-1">
                    <span className={`text-[10px] ${f.decisions ? 'text-green-400' : 'text-war-muted'}`}>
                      {f.decisions ? '✓ submitted' : '⏳ deciding...'}
                    </span>
                  </div>
                )}
                {f.bankrupt && <p className="text-red-400 text-[10px] font-bold">BANKRUPT</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
