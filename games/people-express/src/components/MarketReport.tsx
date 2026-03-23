import { QuarterRecord } from '../types';
import TimeSeriesChart from './charts/TimeSeriesChart';
import { formatPercent } from '../utils/formatting';

interface MarketReportProps {
  history: QuarterRecord[];
}

export default function MarketReport({ history }: MarketReportProps) {
  const data = history.map(h => ({
    label: h.label,
    peFare: h.state.decisions.peopleFare,
    competitorFare: h.state.competitorFare,
    marketShare: h.state.peMarketShare,
    marketAwareness: h.state.marketAwareness,
    totalPassengers: h.state.pePassengers,
  }));

  return (
    <div className="space-y-4">
      <TimeSeriesChart
        title="PE Fare vs. Competitor Fare"
        data={data}
        series={[
          { key: 'peFare', name: 'PE Fare', color: '#3b82f6' },
          { key: 'competitorFare', name: 'Competitor Fare', color: '#ef4444' },
        ]}
        yAxisFormatter={(v) => `$${v.toFixed(3)}`}
      />

      <TimeSeriesChart
        title="Market Share"
        data={data}
        series={[
          { key: 'marketShare', name: 'PE Market Share', color: '#22c55e' },
        ]}
        yAxisFormatter={(v) => formatPercent(v)}
      />

      <TimeSeriesChart
        title="Market Awareness"
        data={data}
        series={[
          { key: 'marketAwareness', name: 'Awareness', color: '#f59e0b' },
        ]}
        yAxisFormatter={(v) => formatPercent(v)}
      />

      <TimeSeriesChart
        title="Passengers (Seat-Miles/Quarter)"
        data={data}
        series={[
          { key: 'totalPassengers', name: 'Passengers', color: '#06b6d4' },
        ]}
        yAxisFormatter={(v) => {
          if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
          if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
          return String(v);
        }}
      />
    </div>
  );
}
