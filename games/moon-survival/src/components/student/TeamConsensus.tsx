import { useState, useRef, useEffect } from 'react';
import DraggableRankingList from '../shared/DraggableRankingList';
import Timer from '../shared/Timer';
import { SURVIVAL_ITEMS } from '../../data/items';
import type { Team } from '../../types';

interface TeamConsensusProps {
  playerName: string;
  team: Team;
  timerRemaining: number | null;
  onUpdateRanking: (ranking: string[]) => void;
  onConfirm: () => void;
  onUnconfirm: () => void;
  onSendChat: (text: string) => void;
}

export default function TeamConsensus({
  playerName,
  team,
  timerRemaining,
  onUpdateRanking,
  onConfirm,
  onUnconfirm,
  onSendChat,
}: TeamConsensusProps) {
  const [chatInput, setChatInput] = useState('');
  const [showChat, setShowChat] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const hasConfirmed = team.confirmedBy.includes(playerName);
  const allConfirmed = team.members.length > 0 && team.confirmedBy.length === team.members.length;
  const ranking = team.consensusRanking || SURVIVAL_ITEMS.map(i => i.id);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [team.chat.length]);

  function handleSendChat(e: React.FormEvent) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    onSendChat(text);
    setChatInput('');
  }

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-space-bg/95 backdrop-blur border-b border-space-border p-4">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-space-text">Team {team.name}</h2>
            <p className="text-space-muted text-xs">
              {team.confirmedBy.length}/{team.members.length} confirmed
              {allConfirmed && <span className="text-green-400 ml-1">— All confirmed!</span>}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowChat(!showChat)}
              className="relative px-3 py-1.5 bg-space-panel border border-space-border rounded-lg text-sm text-space-muted hover:text-space-text transition-colors"
            >
              💬 Chat
              {team.chat.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-space-accent rounded-full text-[10px] text-black flex items-center justify-center font-bold">
                  {team.chat.length > 99 ? '99' : team.chat.length}
                </span>
              )}
            </button>
            <Timer seconds={timerRemaining} />
          </div>
        </div>
      </div>

      <div className="flex-1 flex max-w-5xl mx-auto w-full">
        {/* Ranking area */}
        <div className={`flex-1 p-4 pb-24 overflow-y-auto ${showChat ? 'hidden md:block' : ''}`}>
          <div className="max-w-lg mx-auto space-y-3">
            <p className="text-space-muted text-sm">
              Work with your team to create a consensus ranking. Anyone can drag items.
            </p>

            {/* Team members status */}
            <div className="flex flex-wrap gap-2">
              {team.members.map(m => (
                <span
                  key={m}
                  className={`text-xs px-2 py-1 rounded-full ${
                    team.confirmedBy.includes(m)
                      ? 'bg-green-900/40 text-green-400 border border-green-700/50'
                      : 'bg-space-panel text-space-muted border border-space-border'
                  }`}
                >
                  {m} {team.confirmedBy.includes(m) ? '✓' : ''}
                </span>
              ))}
            </div>

            <DraggableRankingList
              items={SURVIVAL_ITEMS}
              ranking={ranking}
              onRankingChange={onUpdateRanking}
              disabled={hasConfirmed}
            />
          </div>
        </div>

        {/* Chat panel */}
        {showChat && (
          <div className="w-full md:w-80 border-l border-space-border flex flex-col bg-space-bg">
            <div className="p-3 border-b border-space-border flex items-center justify-between">
              <span className="text-sm font-medium text-space-text">Team Chat</span>
              <button
                onClick={() => setShowChat(false)}
                className="text-space-muted hover:text-space-text md:hidden"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {team.chat.length === 0 && (
                <p className="text-space-muted text-xs text-center py-4">No messages yet. Start discussing!</p>
              )}
              {team.chat.map((msg, i) => (
                <div key={i} className={`${msg.sender === playerName ? 'text-right' : ''}`}>
                  <span className="text-[10px] text-space-muted">{msg.sender}</span>
                  <div className={`text-sm rounded-lg px-3 py-1.5 inline-block max-w-[85%] ${
                    msg.sender === playerName
                      ? 'bg-space-accent/20 text-space-accent'
                      : 'bg-space-panel text-space-text'
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleSendChat} className="p-3 border-t border-space-border flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="Type a message..."
                maxLength={200}
                className="flex-1 px-3 py-2 bg-space-panel border border-space-border rounded-lg text-sm text-space-text focus:outline-none focus:border-space-accent"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-space-accent text-black rounded-lg text-sm font-medium"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Confirm/unconfirm footer */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-space-bg via-space-bg to-transparent">
        <div className="max-w-lg mx-auto">
          {hasConfirmed ? (
            <button
              onClick={onUnconfirm}
              className="w-full py-3 bg-space-panel hover:bg-space-border text-space-text font-medium rounded-lg border border-green-700/50 transition-colors"
            >
              ✓ Confirmed — Tap to change your mind
            </button>
          ) : (
            <button
              onClick={onConfirm}
              className="w-full py-3 bg-space-accent hover:bg-amber-600 text-black font-bold rounded-lg transition-colors text-lg"
            >
              Confirm Team Ranking
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
