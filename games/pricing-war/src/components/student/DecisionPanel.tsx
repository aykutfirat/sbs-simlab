import { useState } from 'react';
import Timer from '../shared/Timer';
import { formatMoney, formatPrice } from '../../utils/formatting';
import type { FirmState, CompetitorInfo, ActiveEvent } from '../../types';

interface DecisionPanelProps {
  firm: FirmState;
  competitors: CompetitorInfo[];
  round: number;
  totalRounds: number;
  timerRemaining: number | null;
  events: ActiveEvent[];
  onSubmit: (decisions: { price: number; qualityInvestment: number; marketingSpend: number }) => void;
  hasSubmitted: boolean;
}

export default function DecisionPanel({
  firm, competitors, round, totalRounds, timerRemaining, events,
  onSubmit, hasSubmitted,
}: DecisionPanelProps) {
  const [price, setPrice] = useState(firm.price);
  const [qualityInvestment, setQualityInvestment] = useState(0);
  const [marketingSpend, setMarketingSpend] = useState(0);

  const estimatedRevenue = firm.customers * price;
  const estimatedCost = 15000 + firm.customers * 5 + qualityInvestment + marketingSpend;
  const estimatedProfit = estimatedRevenue - estimatedCost;

  if (hasSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="text-5xl">✅</div>
          <h2 className="text-2xl font-bold text-war-text">Decisions Locked In!</h2>
          <p className="text-war-muted">Price: {formatPrice(price)} · Quality: {formatMoney(qualityInvestment)} · Marketing: {formatMoney(marketingSpend)}</p>
          <p className="text-war-muted text-sm">Waiting for all teams to submit...</p>
          {timerRemaining !== null && <Timer seconds={timerRemaining} />}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-28">
      <div className="max-w-lg mx-auto space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-war-text">{firm.icon} {firm.name}</h2>
            <p className="text-war-muted text-sm">Round {round} of {totalRounds} · Cumulative: {formatMoney(firm.cumulativeProfit)}</p>
          </div>
          <Timer seconds={timerRemaining} />
        </div>

        {/* Active events */}
        {events.length > 0 && (
          <div className="space-y-1">
            {events.map((ae, i) => (
              <div key={i} className="bg-orange-900/20 border border-orange-700/30 rounded-lg px-3 py-2 text-sm text-orange-300">
                ⚡ {ae.event.name}: {ae.event.description} ({ae.remainingRounds} round{ae.remainingRounds > 1 ? 's' : ''} left)
              </div>
            ))}
          </div>
        )}

        {/* Competitors overview */}
        {competitors.length > 0 && competitors.some(c => c.price !== undefined) && (
          <div className="bg-war-panel border border-war-border rounded-lg p-3">
            <p className="text-xs text-war-muted mb-2">Competitor Prices (last round)</p>
            <div className="flex flex-wrap gap-2">
              {competitors.filter(c => !c.bankrupt).map(c => (
                <span key={c.id} className="text-sm bg-war-bg px-2 py-1 rounded text-war-text">
                  {c.icon} {c.name}: {c.price !== undefined ? formatPrice(c.price) : '???'}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Price slider */}
        <div className="bg-war-panel border border-war-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-war-text">Subscription Price</label>
            <span className="text-2xl font-bold text-war-accent">{formatPrice(price)}</span>
          </div>
          <input
            type="range"
            min={8}
            max={30}
            step={0.5}
            value={price}
            onChange={e => setPrice(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-war-muted mt-1">
            <span>$8 (aggressive)</span>
            <span>$30 (premium)</span>
          </div>
        </div>

        {/* Quality investment slider */}
        <div className="bg-war-panel border border-war-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-war-text">Quality Investment (R&D)</label>
            <span className="text-lg font-bold text-war-green">{formatMoney(qualityInvestment)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10000}
            step={500}
            value={qualityInvestment}
            onChange={e => setQualityInvestment(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-war-muted mt-1">
            <span>$0</span>
            <span>$10,000</span>
          </div>
          <p className="text-xs text-war-muted mt-2">Current quality: {firm.quality.toFixed(1)}/100. Decays 3%/round without investment.</p>
        </div>

        {/* Marketing spend slider */}
        <div className="bg-war-panel border border-war-border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium text-war-text">Marketing Spend</label>
            <span className="text-lg font-bold text-war-purple">{formatMoney(marketingSpend)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={10000}
            step={500}
            value={marketingSpend}
            onChange={e => setMarketingSpend(Number(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-war-muted mt-1">
            <span>$0</span>
            <span>$10,000</span>
          </div>
          <p className="text-xs text-war-muted mt-2">Current brand: {(firm.brand * 100).toFixed(0)}%. Decays 5%/round without marketing.</p>
        </div>

        {/* Cost preview */}
        <div className="bg-war-bg border border-war-border rounded-lg p-4 text-sm">
          <p className="text-war-muted mb-1">Estimated this round (based on current customers):</p>
          <div className="grid grid-cols-2 gap-1">
            <span className="text-war-muted">Revenue:</span>
            <span className="text-war-text text-right">{formatMoney(estimatedRevenue)}</span>
            <span className="text-war-muted">Total Cost:</span>
            <span className="text-war-text text-right">{formatMoney(estimatedCost)}</span>
            <span className="text-war-muted font-medium">Est. Profit:</span>
            <span className={`text-right font-bold ${estimatedProfit >= 0 ? 'text-war-green' : 'text-war-red'}`}>
              {formatMoney(estimatedProfit)}
            </span>
          </div>
        </div>

        {/* Submit */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-war-bg via-war-bg to-transparent">
          <div className="max-w-lg mx-auto">
            <button
              onClick={() => onSubmit({ price, qualityInvestment, marketingSpend })}
              className="w-full py-3 bg-war-accent hover:bg-indigo-600 text-white font-bold rounded-lg transition-colors text-lg"
            >
              Lock In Decisions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
