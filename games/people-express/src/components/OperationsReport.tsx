import { QuarterRecord } from '../types';
import TimeSeriesChart from './charts/TimeSeriesChart';
import { formatNumber, formatPercent } from '../utils/formatting';

interface OperationsReportProps {
  history: QuarterRecord[];
}

export default function OperationsReport({ history }: OperationsReportProps) {
  const data = history.map(h => ({
    label: h.label,
    aircraft: Math.round(h.state.aircraft),
    aircraftOnOrder: Math.round(h.state.aircraftOnOrder),
    totalEmployees: h.state.totalEmployees,
    experiencedEmployees: h.state.experiencedEmployees,
    loadFactor: h.state.loadFactor,
    pePassengers: h.state.pePassengers,
  }));

  return (
    <div className="space-y-4">
      <TimeSeriesChart
        title="Fleet Size"
        data={data}
        series={[
          { key: 'aircraft', name: 'Active Aircraft', color: '#3b82f6' },
          { key: 'aircraftOnOrder', name: 'On Order', color: '#94a3b8', dashed: true },
        ]}
        yAxisFormatter={(v) => String(Math.round(v))}
      />

      <TimeSeriesChart
        title="Workforce"
        data={data}
        series={[
          { key: 'totalEmployees', name: 'Total Employees', color: '#8b5cf6' },
          { key: 'experiencedEmployees', name: 'Experienced', color: '#22c55e' },
        ]}
        yAxisFormatter={(v) => formatNumber(v)}
      />

      <TimeSeriesChart
        title="Load Factor (Passengers / Capacity)"
        data={data}
        series={[
          { key: 'loadFactor', name: 'Load Factor', color: '#f59e0b' },
        ]}
        yAxisFormatter={(v) => formatPercent(v)}
        referenceLines={[
          { y: 0.95, label: 'Max (95%)', color: '#ef4444' },
          { y: 0.70, label: 'Target (70%)', color: '#22c55e' },
        ]}
      />

      <TimeSeriesChart
        title="Revenue Passenger Miles (per quarter)"
        data={data}
        series={[
          { key: 'pePassengers', name: 'Seat-Miles Sold', color: '#06b6d4' },
        ]}
        yAxisFormatter={(v) => formatNumber(v)}
      />
    </div>
  );
}
