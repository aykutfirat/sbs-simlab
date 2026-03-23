import { useState } from 'react';
import { QuarterRecord } from '../types';
import FinancialReport from './FinancialReport';
import OperationsReport from './OperationsReport';
import MarketReport from './MarketReport';
import PeopleServiceReport from './PeopleServiceReport';

interface ReportsDashboardProps {
  history: QuarterRecord[];
}

const TABS = [
  { id: 'financial', label: 'Financial' },
  { id: 'operations', label: 'Operations' },
  { id: 'market', label: 'Market' },
  { id: 'people', label: 'People & Service' },
] as const;

type TabId = typeof TABS[number]['id'];

export default function ReportsDashboard({ history }: ReportsDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabId>('financial');

  return (
    <div className="h-full flex flex-col">
      {/* Tab bar */}
      <div className="flex border-b border-cockpit-border bg-cockpit-panel/50">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors duration-200
              ${activeTab === tab.id
                ? 'text-cockpit-accent border-b-2 border-cockpit-accent'
                : 'text-cockpit-muted hover:text-cockpit-text'
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'financial' && <FinancialReport history={history} />}
        {activeTab === 'operations' && <OperationsReport history={history} />}
        {activeTab === 'market' && <MarketReport history={history} />}
        {activeTab === 'people' && <PeopleServiceReport history={history} />}
      </div>
    </div>
  );
}
