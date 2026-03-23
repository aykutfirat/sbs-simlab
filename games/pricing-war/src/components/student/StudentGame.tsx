import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import DecisionPanel from './DecisionPanel';
import RoundResults from './RoundResults';
import type { TeamState, Decisions } from '../../types';

export default function StudentGame() {
  const { roomCode, teamName } = useParams<{ roomCode: string; teamName: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<TeamState | null>(null);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(true);

  const code = roomCode?.toUpperCase() || '';
  const team = teamName ? decodeURIComponent(teamName) : '';
  const playerName = sessionStorage.getItem('pricingWarPlayer') || 'Player';

  useEffect(() => {
    if (!code || !team) { navigate('/'); return; }

    socket.connect();

    socket.on('connect', () => {
      socket.emit('join-game', { code, teamName: team, playerName }, (res: any) => {
        setJoining(false);
        if (!res.success) {
          setError(res.error || 'Failed to join');
        } else {
          setFirmId(res.firmId);
        }
      });
    });

    socket.on('team-state', (s: TeamState) => setState(s));
    socket.on('kicked', () => setError('Your team has been removed from the game.'));

    return () => {
      socket.off('connect');
      socket.off('team-state');
      socket.off('kicked');
      socket.disconnect();
    };
  }, [code, team, playerName, navigate]);

  const handleSubmitDecisions = useCallback((decisions: Decisions) => {
    if (!firmId) return;
    socket.emit('submit-decisions', { code, firmId, decisions }, (res: any) => {
      if (!res.success) alert(res.error || 'Failed to submit');
    });
  }, [code, firmId]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <p className="text-red-400 text-lg">{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-war-panel border border-war-border rounded-lg text-war-text hover:bg-war-border transition-colors">Back to Home</button>
        </div>
      </div>
    );
  }

  if (joining || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-war-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-war-muted">Connecting to game {code}...</p>
        </div>
      </div>
    );
  }

  switch (state.phase) {
    case 'lobby':
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="text-5xl">{state.firm.icon}</div>
            <h2 className="text-2xl font-bold text-war-text">{state.firm.name}</h2>
            <p className="text-war-muted">Waiting for game to start...</p>
            <div className="flex items-center justify-center gap-2 text-war-muted text-sm">
              <div className="w-2 h-2 bg-war-accent rounded-full animate-pulse" />
              The instructor will start the game shortly
            </div>
          </div>
        </div>
      );

    case 'playing':
      return (
        <DecisionPanel
          firm={state.firm}
          competitors={state.competitors}
          round={state.round + 1}
          totalRounds={state.totalRounds}
          timerRemaining={state.timerRemaining}
          events={state.events}
          onSubmit={handleSubmitDecisions}
          hasSubmitted={state.firm.decisions !== null}
        />
      );

    case 'round-results':
      return (
        <RoundResults
          firm={state.firm}
          competitors={state.competitors}
          round={state.round}
          totalRounds={state.totalRounds}
        />
      );

    case 'debrief':
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="text-center space-y-4">
            <div className="text-5xl">🏆</div>
            <h2 className="text-2xl font-bold text-war-text">Game Over!</h2>
            <p className="text-war-muted">
              {state.firm.icon} {state.firm.name} — Final Profit: <span className={state.firm.cumulativeProfit >= 0 ? 'text-war-green' : 'text-war-red'}>${state.firm.cumulativeProfit.toLocaleString()}</span>
            </p>
            <p className="text-war-muted text-sm">Look at the instructor screen for the full debrief.</p>
          </div>
        </div>
      );

    default:
      return null;
  }
}
