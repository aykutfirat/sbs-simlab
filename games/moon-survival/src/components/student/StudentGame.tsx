import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { socket } from '../../socket';
import WaitingRoom from './WaitingRoom';
import IndividualRanking from './IndividualRanking';
import TeamConsensus from './TeamConsensus';
import StudentResults from './StudentResults';
import type { PlayerState } from '../../types';

export default function StudentGame() {
  const { roomCode, playerName } = useParams<{ roomCode: string; playerName: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PlayerState | null>(null);
  const [error, setError] = useState('');
  const [joining, setJoining] = useState(true);

  const code = roomCode?.toUpperCase() || '';
  const name = playerName ? decodeURIComponent(playerName) : '';

  useEffect(() => {
    if (!code || !name) {
      navigate('/');
      return;
    }

    socket.connect();

    socket.on('connect', () => {
      socket.emit('join-game', { code, name }, (res: any) => {
        setJoining(false);
        if (!res.success) {
          setError(res.error || 'Failed to join');
        }
      });
    });

    socket.on('player-state', (playerState: PlayerState) => {
      setState(playerState);
    });

    socket.on('kicked', () => {
      setError('You have been removed from the game.');
    });

    socket.on('disconnect', () => {
      // Will auto-reconnect
    });

    return () => {
      socket.off('connect');
      socket.off('player-state');
      socket.off('kicked');
      socket.off('disconnect');
      socket.disconnect();
    };
  }, [code, name, navigate]);

  const handleSubmitIndividual = useCallback((ranking: string[]) => {
    socket.emit('submit-individual-ranking', { code, name, ranking }, (res: any) => {
      if (!res.success) {
        alert(res.error || 'Failed to submit');
      }
    });
  }, [code, name]);

  const handleUpdateTeamRanking = useCallback((ranking: string[]) => {
    if (!state?.team) return;
    socket.emit('update-team-ranking', { code, teamId: state.team.id, ranking }, () => {});
  }, [code, state?.team?.id]);

  const handleConfirm = useCallback(() => {
    if (!state?.team) return;
    socket.emit('confirm-team-ranking', { code, teamId: state.team.id, playerName: name }, () => {});
  }, [code, name, state?.team?.id]);

  const handleUnconfirm = useCallback(() => {
    if (!state?.team) return;
    socket.emit('unconfirm-team-ranking', { code, teamId: state.team.id, playerName: name }, () => {});
  }, [code, name, state?.team?.id]);

  const handleSendChat = useCallback((text: string) => {
    if (!state?.team) return;
    socket.emit('team-chat-message', { code, teamId: state.team.id, sender: name, text });
  }, [code, name, state?.team?.id]);

  // Loading / error states
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-4xl">❌</div>
          <p className="text-red-400 text-lg">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-space-panel border border-space-border rounded-lg text-space-text hover:bg-space-border transition-colors"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  if (joining || !state) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-space-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-space-muted">Connecting to game {code}...</p>
        </div>
      </div>
    );
  }

  // Phase routing
  switch (state.phase) {
    case 'lobby':
      return (
        <WaitingRoom
          playerName={name}
          teamName={state.team?.name ?? null}
          playerCount={1} // The server doesn't send total count to player, use 1 as placeholder
        />
      );

    case 'individual':
      return (
        <IndividualRanking
          playerName={name}
          timerRemaining={state.timerRemaining}
          hasSubmitted={state.player.individualRanking !== null}
          onSubmit={handleSubmitIndividual}
        />
      );

    case 'team':
      if (!state.team) {
        return (
          <div className="min-h-screen flex items-center justify-center p-4">
            <p className="text-space-muted">You are not assigned to a team.</p>
          </div>
        );
      }
      return (
        <TeamConsensus
          playerName={name}
          team={state.team}
          timerRemaining={state.timerRemaining}
          onUpdateRanking={handleUpdateTeamRanking}
          onConfirm={handleConfirm}
          onUnconfirm={handleUnconfirm}
          onSendChat={handleSendChat}
        />
      );

    case 'results':
    case 'debrief':
      return (
        <StudentResults
          player={state.player}
          team={state.team}
          phase={state.phase}
        />
      );

    default:
      return null;
  }
}
