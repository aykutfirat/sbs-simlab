import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { socket } from '../../socket';
import NASAReveal from './NASAReveal';
import SynergyChart from './SynergyChart';
import ItemAnalysisChart from './ItemAnalysisChart';
import type { GameResults } from '../../types';

type DebriefTab = 'overview' | 'nasa' | 'synergy' | 'items';

export default function DebriefDashboard() {
  const { roomCode } = useParams<{ roomCode: string }>();
  const [results, setResults] = useState<GameResults | null>(null);
  const [tab, setTab] = useState<DebriefTab>('overview');
  const [error, setError] = useState('');

  const code = roomCode?.toUpperCase() || '';

  useEffect(() => {
    socket.connect();

    socket.on('connect', () => {
      socket.emit('instructor-rejoin', code, (res: any) => {
        if (!res.success) {
          setError(res.error || 'Failed to connect');
          return;
        }
        socket.emit('get-results', code, (resData: any) => {
          if (resData.success) {
            setResults(resData.results);
          }
        });
      });
    });

    return () => {
      socket.off('connect');
      socket.disconnect();
    };
  }, [code]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-400">{error}</p>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-space-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-space-muted">Loading results...</p>
        </div>
      </div>
    );
  }

  const tabs: { id: DebriefTab; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'nasa', label: 'NASA Rankings' },
    { id: 'synergy', label: 'Synergy Analysis' },
    { id: 'items', label: 'Item Analysis' },
  ];

  const teams = Object.values(results.teams);

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-space-text flex items-center justify-center gap-3">
            🌙 NASA Moon Survival — Debrief
          </h1>
          <p className="text-space-muted mt-1">Room: {code}</p>
        </div>

        {/* Tab navigation */}
        <div className="flex justify-center gap-2">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === t.id
                  ? 'bg-space-accent text-black'
                  : 'bg-space-panel text-space-muted hover:text-space-text border border-space-border'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="text-center bg-blue-900/20 border border-blue-800/30 rounded-lg p-6">
              <h2 className="text-xl font-bold text-blue-300 mb-2">The Key Question</h2>
              <p className="text-blue-200 text-lg">
                Did teams outperform their best individual member?
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map(team => {
                const hasSynergy = team.synergy > 0;
                return (
                  <div key={team.id} className="bg-space-panel border border-space-border rounded-lg p-5">
                    <h3 className="font-bold text-space-text text-lg mb-3">{team.name}</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-space-muted">Team Score</span>
                        <span className="text-blue-400 font-bold text-lg">{team.teamScore ?? '—'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-space-muted">Best Individual</span>
                        <span className="text-space-accent font-medium">{team.bestIndividualScore}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-space-muted">Avg Individual</span>
                        <span className="text-space-text">{team.averageIndividualScore}</span>
                      </div>
                      <hr className="border-space-border" />
                      <div className={`flex justify-between font-bold ${hasSynergy ? 'text-green-400' : 'text-red-400'}`}>
                        <span>Synergy</span>
                        <span>{team.synergy > 0 ? '+' : ''}{team.synergy}</span>
                      </div>
                    </div>

                    {/* Individual scores */}
                    <div className="mt-3 pt-3 border-t border-space-border">
                      <p className="text-xs text-space-muted mb-1.5">Members:</p>
                      {team.members.map(name => {
                        const p = results.players[name];
                        return (
                          <div key={name} className="flex justify-between text-xs py-0.5">
                            <span className="text-space-text">{name}</span>
                            <span className="text-space-muted">{p?.individualScore ?? '—'}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Teams', value: teams.length },
                { label: 'Achieved Synergy', value: teams.filter(t => t.synergy > 0).length },
                { label: 'Best Team Score', value: Math.min(...teams.map(t => t.teamScore ?? Infinity)) },
                { label: 'Best Individual', value: Math.min(...Object.values(results.players).map(p => p.individualScore ?? Infinity)) },
              ].map(stat => (
                <div key={stat.label} className="bg-space-panel border border-space-border rounded-lg p-3 text-center">
                  <p className="text-space-muted text-xs">{stat.label}</p>
                  <p className="text-space-text text-xl font-bold mt-1">{stat.value === Infinity ? '—' : stat.value}</p>
                </div>
              ))}
            </div>

            {/* Discussion prompts */}
            <div className="bg-space-panel border border-space-border rounded-lg p-6">
              <h3 className="text-lg font-bold text-space-text mb-3">Discussion Questions</h3>
              <ol className="space-y-2 text-space-muted text-sm list-decimal list-inside">
                <li>Which items did most people get wrong? Why might that be?</li>
                <li>How did your team's discussion process work? Did one person dominate?</li>
                <li>Did any team member have expert knowledge that the team failed to use?</li>
                <li>What strategies helped teams achieve synergy?</li>
                <li>How does this relate to decision-making in organizations?</li>
              </ol>
            </div>
          </div>
        )}

        {tab === 'nasa' && <NASAReveal />}
        {tab === 'synergy' && <SynergyChart results={results} />}
        {tab === 'items' && <ItemAnalysisChart results={results} />}
      </div>
    </div>
  );
}
