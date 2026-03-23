import { useState, useEffect } from 'react';
import { RoundResult } from '../types';
import { formatCurrency } from '../utils/formatting';
import { getFeedbackMessage } from '../engine/GameEngine';

interface DailyResultsProps {
  result: RoundResult;
  onNextDay: () => void;
  isLastDay: boolean;
}

export function DailyResults({ result, onNextDay, isLastDay }: DailyResultsProps) {
  const [revealedDemand, setRevealedDemand] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const feedback = getFeedbackMessage(result.order, result.demand);

  useEffect(() => {
    // Animate demand reveal
    const t1 = setTimeout(() => setRevealedDemand(true), 600);
    const t2 = setTimeout(() => setShowDetails(true), 1200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [result.day]);

  const feedbackColors = {
    perfect: 'bg-green-50 border-green-200 text-green-700',
    waste: 'bg-orange-50 border-orange-200 text-orange-700',
    shortage: 'bg-red-50 border-red-200 text-red-700',
    neutral: 'bg-blue-50 border-blue-200 text-blue-700',
  };

  const feedbackIcons = {
    perfect: '🎯',
    waste: '📦',
    shortage: '😞',
    neutral: '👍',
  };

  const maxBar = Math.max(result.order, result.demand);

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
      {/* Comparison header */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-sm text-gray-500">You ordered</div>
          <div className="text-3xl font-bold text-blue-600">{result.order}</div>
        </div>
        <div className="text-center">
          <div className="text-sm text-gray-500">Customers wanted</div>
          <div className={`text-3xl font-bold text-orange-600 transition-all duration-500 ${revealedDemand ? 'opacity-100 scale-100' : 'opacity-0 scale-75'}`}>
            {revealedDemand ? result.demand : '?'}
          </div>
        </div>
      </div>

      {/* Visual bar */}
      {revealedDemand && (
        <div className="mb-4">
          <div className="flex gap-1 items-end h-8">
            <div className="flex-1">
              <div className="text-xs text-gray-400 mb-1">Order vs Demand</div>
              <div className="relative h-6 bg-gray-100 rounded overflow-hidden">
                {result.order >= result.demand ? (
                  <>
                    <div
                      className="absolute h-full bg-green-400 rounded-l transition-all duration-700"
                      style={{ width: `${(result.sold / maxBar) * 100}%` }}
                    />
                    <div
                      className="absolute h-full bg-orange-300 rounded-r transition-all duration-700"
                      style={{ left: `${(result.sold / maxBar) * 100}%`, width: `${(result.wasted / maxBar) * 100}%` }}
                    />
                  </>
                ) : (
                  <>
                    <div
                      className="absolute h-full bg-green-400 rounded-l transition-all duration-700"
                      style={{ width: `${(result.sold / maxBar) * 100}%` }}
                    />
                    <div
                      className="absolute h-full bg-red-300 rounded-r transition-all duration-700"
                      style={{ left: `${(result.sold / maxBar) * 100}%`, width: `${(result.shortage / maxBar) * 100}%` }}
                    />
                  </>
                )}
              </div>
              <div className="flex justify-between text-xs mt-1">
                <span className="text-green-600">Sold: {result.sold}</span>
                {result.wasted > 0 && <span className="text-orange-600">Wasted: {result.wasted}</span>}
                {result.shortage > 0 && <span className="text-red-600">Short: {result.shortage}</span>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profit breakdown */}
      {showDetails && (
        <div className="animate-fadeIn">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div className="text-gray-600">Revenue ({result.sold} x $6.00)</div>
              <div className="text-right font-medium text-green-600">+{formatCurrency(result.revenue)}</div>

              <div className="text-gray-600">Cost ({result.order} x $2.00)</div>
              <div className="text-right font-medium text-red-600">-{formatCurrency(result.dailyCost)}</div>

              {result.salvageValue > 0 && (
                <>
                  <div className="text-gray-600">Salvage ({result.wasted} x $0.50)</div>
                  <div className="text-right font-medium text-amber-600">+{formatCurrency(result.salvageValue)}</div>
                </>
              )}

              <div className="border-t border-gray-200 pt-1 font-bold text-gray-800">Daily Profit</div>
              <div className={`border-t border-gray-200 pt-1 text-right font-bold ${result.profit >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                {formatCurrency(result.profit)}
              </div>
            </div>
          </div>

          {/* Feedback */}
          <div className={`rounded-lg p-3 border mb-4 text-center font-medium ${feedbackColors[feedback.type]}`}>
            <span className="mr-2">{feedbackIcons[feedback.type]}</span>
            {feedback.message}
          </div>

          {/* Next button */}
          <button
            onClick={onNextDay}
            className="w-full py-3 bg-bagel-600 hover:bg-bagel-700 text-white font-bold rounded-lg shadow transition-all active:scale-[0.98]"
          >
            {isLastDay ? 'View Results' : 'Next Day →'}
          </button>
        </div>
      )}
    </div>
  );
}
