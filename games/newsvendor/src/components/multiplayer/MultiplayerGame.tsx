import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerSocket } from '../../hooks/usePlayerSocket';
import { formatCurrency } from '../../utils/formatting';
import { HistoryChart } from '../HistoryChart';
import { HistoryTable } from '../HistoryTable';
import { MAX_ORDER, MIN_ORDER } from '../../engine/constants';
import { DebriefScreen } from '../DebriefScreen';

export function MultiplayerGame() {
  const { gameCode: routeCode, playerName: routeName } = useParams<{ gameCode: string; playerName: string }>();
  const navigate = useNavigate();
  const {
    connected,
    playerState,
    debriefData,
    timerRemaining,
    gameCode,
    playerName,
    joinGame,
    submitOrder,
    requestDebrief,
    leaveGame,
  } = usePlayerSocket();

  const [order, setOrder] = useState(100);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [historyTab, setHistoryTab] = useState<'chart' | 'table'>('chart');

  // Auto-rejoin if navigated directly
  useEffect(() => {
    if (connected && routeCode && routeName && !gameCode) {
      joinGame(routeCode, decodeURIComponent(routeName));
    }
  }, [connected, routeCode, routeName, gameCode, joinGame]);

  // Reset submitted state when round changes
  useEffect(() => {
    if (playerState) {
      setSubmitted(false);
    }
  }, [playerState?.currentRound, playerState?.showingResults]);

  // Request debrief data when entering debrief phase
  useEffect(() => {
    if (playerState?.phase === 'debrief' && !debriefData) {
      requestDebrief();
    }
  }, [playerState?.phase, debriefData, requestDebrief]);

  if (!playerState) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-pulse text-bagel-500 text-lg mb-2">Connecting...</div>
          <p className="text-sm text-gray-400">Joining game...</p>
        </div>
      </div>
    );
  }

  // Lobby waiting screen
  if (playerState.phase === 'lobby') {
    return (
      <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50 flex items-center justify-center p-4">
        <div className="max-w-sm w-full text-center">
          <img src="/bagel.svg" alt="" className="w-16 h-16 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-bagel-800 mb-2">Welcome, {playerName}!</h1>
          <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
            <div className="animate-pulse text-bagel-500 text-lg mb-2">Waiting for instructor to start...</div>
            <p className="text-sm text-gray-500">
              Game: <code className="font-bold text-bagel-700">{playerState.gameCode}</code>
            </p>
            <div className="mt-4 bg-bagel-50 rounded-lg p-4 text-sm text-gray-600">
              <p className="font-medium mb-2">While you wait — here's the scenario:</p>
              <p>You run a bagel shop. Each day, decide how many bagels to order. Sell at $6, cost $2, unsold bagels salvaged at $0.50. Maximize your profit!</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Debrief: show individual debrief using existing component
  if (playerState.phase === 'debrief' && debriefData) {
    // Build a GameState-compatible object for the existing debrief
    const playerDebriefInfo = debriefData.players[playerName || ''];
    if (playerDebriefInfo) {
      const fakeGameState = {
        config: debriefData.config,
        demands: debriefData.demands,
        rounds: playerDebriefInfo.rounds,
        currentDay: debriefData.config.rounds,
        cumulativeProfit: playerDebriefInfo.totalProfit,
        phase: 'debrief' as const,
        pendingOrder: null,
        showingResult: false,
      };

      return (
        <DebriefScreen
          state={fakeGameState}
          onRestart={() => {
            leaveGame();
            navigate('/multiplayer/join');
          }}
        />
      );
    }
  }

  // Playing phase
  const profitColor = playerState.cumulativeProfit >= 0 ? 'text-green-600' : 'text-red-600';
  const currentResult = playerState.currentResult;
  const progress = ((playerState.currentRound - 1) / playerState.config.rounds) * 100;

  const handleSubmit = async () => {
    setSubmitting(true);
    const result = await submitOrder(order);
    if (result.success) {
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-cream-50 to-bagel-50">
      {/* Top bar */}
      <div className="bg-white shadow-sm border-b border-bagel-200 px-4 py-3">
        <div className="max-w-3xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/bagel.svg" alt="" className="w-8 h-8" />
            <div>
              <div className="text-sm text-bagel-600 font-medium">Day {playerState.currentRound} of {playerState.config.rounds}</div>
              <div className="text-xs text-gray-400">{playerName}</div>
            </div>
          </div>

          <div className="text-right">
            <div className="text-xs text-gray-500 uppercase tracking-wide">Total Profit</div>
            <div className={`text-xl font-bold ${profitColor}`}>
              {formatCurrency(playerState.cumulativeProfit)}
            </div>
          </div>
        </div>

        <div className="max-w-3xl mx-auto mt-2">
          <div className="h-2 bg-bagel-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-bagel-400 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* Timer */}
        {timerRemaining !== null && (
          <div className="text-center">
            <span className={`text-2xl font-bold font-mono ${timerRemaining <= 5 ? 'text-red-600' : 'text-bagel-600'}`}>
              {timerRemaining}s
            </span>
          </div>
        )}

        {/* Main interaction area */}
        {playerState.showingResults && currentResult ? (
          // Show results
          <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="text-center">
                <div className="text-sm text-gray-500">You ordered</div>
                <div className="text-3xl font-bold text-blue-600">{currentResult.order}</div>
              </div>
              <div className="text-center">
                <div className="text-sm text-gray-500">Customers wanted</div>
                <div className="text-3xl font-bold text-orange-600">{currentResult.demand}</div>
              </div>
            </div>

            {/* Bar visualization */}
            <div className="mb-4">
              <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                {(() => {
                  const maxBar = Math.max(currentResult.order, currentResult.demand);
                  if (maxBar === 0) return null;
                  return (
                    <>
                      <div
                        className="absolute h-full bg-green-400 rounded-l transition-all duration-700"
                        style={{ width: `${(currentResult.sold / maxBar) * 100}%` }}
                      />
                      {currentResult.wasted > 0 && (
                        <div
                          className="absolute h-full bg-orange-300 transition-all duration-700"
                          style={{
                            left: `${(currentResult.sold / maxBar) * 100}%`,
                            width: `${(currentResult.wasted / maxBar) * 100}%`,
                          }}
                        />
                      )}
                      {currentResult.shortage > 0 && (
                        <div
                          className="absolute h-full bg-red-300 transition-all duration-700"
                          style={{
                            left: `${(currentResult.sold / maxBar) * 100}%`,
                            width: `${(currentResult.shortage / maxBar) * 100}%`,
                          }}
                        />
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-green-600">Sold: {currentResult.sold}</span>
                {currentResult.wasted > 0 && <span className="text-orange-600">Wasted: {currentResult.wasted}</span>}
                {currentResult.shortage > 0 && <span className="text-red-600">Short: {currentResult.shortage}</span>}
              </div>
            </div>

            {/* Profit breakdown */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="text-gray-600">Revenue</div>
                <div className="text-right font-medium text-green-600">+{formatCurrency(currentResult.revenue)}</div>
                <div className="text-gray-600">Cost</div>
                <div className="text-right font-medium text-red-600">-{formatCurrency(currentResult.dailyCost)}</div>
                {currentResult.salvageValue > 0 && (
                  <>
                    <div className="text-gray-600">Salvage</div>
                    <div className="text-right font-medium text-amber-600">+{formatCurrency(currentResult.salvageValue)}</div>
                  </>
                )}
                <div className="border-t border-gray-200 pt-1 font-bold">Daily Profit</div>
                <div className={`border-t border-gray-200 pt-1 text-right font-bold ${currentResult.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                  {formatCurrency(currentResult.profit)}
                </div>
              </div>
            </div>

            <div className="mt-4 text-center text-sm text-gray-500 animate-pulse">
              Waiting for instructor to advance...
            </div>
          </div>
        ) : submitted ? (
          // Submitted, waiting
          <div className="bg-white rounded-xl shadow-md p-6 border border-green-200 text-center">
            <div className="text-green-600 font-bold text-lg mb-1">Order Placed: {order} bagels</div>
            <div className="text-sm text-gray-500 animate-pulse">
              Waiting for demand to be revealed...
            </div>
          </div>
        ) : (
          // Order input
          <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
            <h2 className="text-lg font-bold text-bagel-800 mb-1">
              Day {playerState.currentRound} — Place Your Order
            </h2>
            <p className="text-sm text-gray-500 mb-4">How many bagels should we bake today?</p>

            <div className="flex items-center gap-4 mb-4">
              <input
                type="range"
                min={MIN_ORDER}
                max={MAX_ORDER}
                value={order}
                onChange={(e) => setOrder(parseInt(e.target.value, 10))}
                className="flex-1 h-2 bg-bagel-100 rounded-lg appearance-none cursor-pointer accent-bagel-500"
              />
              <input
                type="number"
                min={MIN_ORDER}
                max={MAX_ORDER}
                value={order}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  if (!isNaN(val)) setOrder(Math.max(MIN_ORDER, Math.min(MAX_ORDER, val)));
                }}
                onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
                className="w-24 px-3 py-2 text-center text-xl font-bold border-2 border-bagel-200 rounded-lg focus:outline-none focus:border-bagel-400"
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-3 bg-bagel-600 hover:bg-bagel-700 text-white font-bold rounded-lg shadow transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {submitting ? 'Submitting...' : `Place Order — ${order} Bagels`}
            </button>
          </div>
        )}

        {/* History */}
        {playerState.rounds.length > 0 && (
          <div className="bg-white rounded-xl shadow-md border border-bagel-100 overflow-hidden">
            <div className="flex border-b border-bagel-100">
              <button
                onClick={() => setHistoryTab('chart')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  historyTab === 'chart'
                    ? 'text-bagel-700 border-b-2 border-bagel-500 bg-bagel-50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Chart
              </button>
              <button
                onClick={() => setHistoryTab('table')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
                  historyTab === 'table'
                    ? 'text-bagel-700 border-b-2 border-bagel-500 bg-bagel-50'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                Table
              </button>
            </div>
            <div className="p-4">
              {historyTab === 'chart' ? (
                <HistoryChart rounds={playerState.rounds} />
              ) : (
                <HistoryTable rounds={playerState.rounds} />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
