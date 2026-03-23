import { useState } from 'react';
import { RoundResult } from '../types';
import { HistoryChart } from './HistoryChart';
import { HistoryTable } from './HistoryTable';

interface HistoryPanelProps {
  rounds: RoundResult[];
}

export function HistoryPanel({ rounds }: HistoryPanelProps) {
  const [activeTab, setActiveTab] = useState<'chart' | 'table'>('chart');

  return (
    <div className="bg-white rounded-xl shadow-md border border-bagel-100 overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-bagel-100">
        <button
          onClick={() => setActiveTab('chart')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'chart'
              ? 'text-bagel-700 border-b-2 border-bagel-500 bg-bagel-50'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Chart View
        </button>
        <button
          onClick={() => setActiveTab('table')}
          className={`flex-1 py-2.5 text-sm font-medium transition-colors ${
            activeTab === 'table'
              ? 'text-bagel-700 border-b-2 border-bagel-500 bg-bagel-50'
              : 'text-gray-400 hover:text-gray-600'
          }`}
        >
          Table View
        </button>
      </div>

      {/* Content */}
      <div className="p-4">
        {activeTab === 'chart' ? (
          <HistoryChart rounds={rounds} />
        ) : (
          <HistoryTable rounds={rounds} />
        )}
      </div>
    </div>
  );
}
