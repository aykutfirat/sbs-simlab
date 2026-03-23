import { QuarterRecord } from '../types';
import TimeSeriesChart from './charts/TimeSeriesChart';
import { formatPercent } from '../utils/formatting';

interface PeopleServiceReportProps {
  history: QuarterRecord[];
}

export default function PeopleServiceReport({ history }: PeopleServiceReportProps) {
  const data = history.map(h => ({
    label: h.label,
    morale: h.state.employeeMorale,
    serviceQuality: h.state.serviceQuality,
    serviceReputation: h.state.serviceReputation,
    workload: h.state.workload,
    quitRate: h.state.quitRate,
    turnoverRate: h.state.totalEmployees > 0
      ? h.state.quitRate / h.state.totalEmployees
      : 0,
  }));

  return (
    <div className="space-y-4">
      <TimeSeriesChart
        title="Employee Morale"
        data={data}
        series={[
          { key: 'morale', name: 'Morale', color: '#8b5cf6' },
        ]}
        yAxisFormatter={(v) => formatPercent(v)}
        referenceLines={[
          { y: 0.4, label: 'Critical', color: '#ef4444' },
        ]}
      />

      <TimeSeriesChart
        title="Service Quality vs. Reputation"
        data={data}
        series={[
          { key: 'serviceQuality', name: 'Actual Quality', color: '#22c55e' },
          { key: 'serviceReputation', name: 'Perceived (Reputation)', color: '#f59e0b', dashed: true },
        ]}
        yAxisFormatter={(v) => formatPercent(v)}
      />

      <TimeSeriesChart
        title="Workload Index"
        data={data}
        series={[
          { key: 'workload', name: 'Workload', color: '#ef4444' },
        ]}
        yAxisFormatter={(v) => `${v.toFixed(2)}x`}
        referenceLines={[
          { y: 1.0, label: 'Balanced', color: '#22c55e' },
          { y: 1.5, label: 'Critical', color: '#ef4444' },
        ]}
      />

      <TimeSeriesChart
        title="Employee Turnover Rate (per quarter)"
        data={data}
        series={[
          { key: 'turnoverRate', name: 'Turnover Rate', color: '#f97316' },
        ]}
        yAxisFormatter={(v) => formatPercent(v)}
      />
    </div>
  );
}
