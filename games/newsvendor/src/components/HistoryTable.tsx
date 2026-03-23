import { RoundResult } from '../types';
import { formatCurrency } from '../utils/formatting';

interface HistoryTableProps {
  rounds: RoundResult[];
}

export function HistoryTable({ rounds }: HistoryTableProps) {
  if (rounds.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
        History will appear after your first order
      </div>
    );
  }

  const reversed = [...rounds].reverse();

  return (
    <div className="overflow-x-auto max-h-64 overflow-y-auto">
      <table className="w-full text-xs">
        <thead className="sticky top-0 bg-bagel-50">
          <tr className="text-gray-500 uppercase">
            <th className="px-2 py-1.5 text-left">Day</th>
            <th className="px-2 py-1.5 text-right">Order</th>
            <th className="px-2 py-1.5 text-right">Demand</th>
            <th className="px-2 py-1.5 text-right">Sold</th>
            <th className="px-2 py-1.5 text-right">Waste</th>
            <th className="px-2 py-1.5 text-right">Short</th>
            <th className="px-2 py-1.5 text-right">Profit</th>
            <th className="px-2 py-1.5 text-right">Cumulative</th>
          </tr>
        </thead>
        <tbody>
          {reversed.map((r, idx) => (
            <tr
              key={r.day}
              className={`border-t border-bagel-50 ${idx === 0 ? 'bg-bagel-50 font-medium' : ''}`}
            >
              <td className="px-2 py-1.5">{r.day}</td>
              <td className="px-2 py-1.5 text-right text-blue-600">{r.order}</td>
              <td className="px-2 py-1.5 text-right text-orange-600">{r.demand}</td>
              <td className="px-2 py-1.5 text-right text-green-600">{r.sold}</td>
              <td className="px-2 py-1.5 text-right text-orange-500">{r.wasted || '-'}</td>
              <td className="px-2 py-1.5 text-right text-red-500">{r.shortage || '-'}</td>
              <td className={`px-2 py-1.5 text-right ${r.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(r.profit)}
              </td>
              <td className={`px-2 py-1.5 text-right font-medium ${r.cumulativeProfit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(r.cumulativeProfit)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
