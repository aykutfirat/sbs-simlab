import { PlayerDecisions, SimulationState } from '../types';
import { quarterLabel, formatCurrency } from '../utils/formatting';
import KeyIndicators from './KeyIndicators';

interface DecisionPanelProps {
  state: SimulationState;
  decisions: PlayerDecisions;
  onUpdateDecisions: (updates: Partial<PlayerDecisions>) => void;
  onAdvanceQuarter: () => void;
  onRestart: () => void;
  // Multiplayer props
  submitMode?: boolean;
  hasSubmitted?: boolean;
  disabled?: boolean;
}

interface SliderInputProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  description: string;
  onChange: (value: number) => void;
  formatter?: (value: number) => string;
  disabled?: boolean;
}

function SliderInput({ label, value, min, max, step, unit, description, onChange, formatter, disabled }: SliderInputProps) {
  const displayValue = formatter ? formatter(value) : value.toString();

  return (
    <div className={`space-y-1 ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex justify-between items-baseline">
        <label className="text-sm font-medium text-cockpit-text">{label}</label>
        <span className="text-sm font-mono text-cockpit-accent">{displayValue} <span className="text-cockpit-muted text-xs">{unit}</span></span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 bg-gray-700 rounded-full appearance-none cursor-pointer
                   [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5
                   [&::-webkit-slider-thumb]:h-3.5 [&::-webkit-slider-thumb]:rounded-full
                   [&::-webkit-slider-thumb]:bg-cockpit-accent [&::-webkit-slider-thumb]:cursor-pointer
                   [&::-webkit-slider-thumb]:hover:bg-blue-400
                   disabled:cursor-not-allowed disabled:[&::-webkit-slider-thumb]:bg-gray-500"
      />
      <p className="text-[10px] text-cockpit-muted">{description}</p>
    </div>
  );
}

export default function DecisionPanel({
  state,
  decisions,
  onUpdateDecisions,
  onAdvanceQuarter,
  onRestart,
  submitMode = false,
  hasSubmitted = false,
  disabled = false,
}: DecisionPanelProps) {
  const nextQuarter = state.quarter + 1;

  return (
    <div className="h-full flex flex-col gap-4 p-4 overflow-y-auto">
      {/* Quarter header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">
            {quarterLabel(nextQuarter)}
          </h2>
          <p className="text-xs text-cockpit-muted">Quarter {nextQuarter} of 40</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-cockpit-muted">Revenue</div>
          <div className="text-sm font-mono text-cockpit-text">{formatCurrency(state.revenue)}/qtr</div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-cockpit-accent rounded-full transition-all duration-300"
          style={{ width: `${(state.quarter / 40) * 100}%` }}
        />
      </div>

      {/* Decision inputs */}
      <div className="space-y-4">
        <h3 className="text-xs font-semibold text-cockpit-muted uppercase tracking-wider">
          Quarterly Decisions
        </h3>

        <SliderInput
          label="Aircraft Purchases"
          value={decisions.aircraftPurchases}
          min={0} max={20} step={1}
          unit="planes/qtr"
          description="New aircraft to order (2-quarter delivery delay)"
          onChange={(v) => onUpdateDecisions({ aircraftPurchases: v })}
          disabled={disabled}
        />

        <SliderInput
          label="Fare"
          value={decisions.peopleFare}
          min={0.03} max={0.25} step={0.005}
          unit="$/seat-mi"
          description={`Competitor fare: $${state.competitorFare.toFixed(3)}/seat-mi`}
          onChange={(v) => onUpdateDecisions({ peopleFare: v })}
          formatter={(v) => `$${v.toFixed(3)}`}
          disabled={disabled}
        />

        <SliderInput
          label="Marketing Spend"
          value={decisions.marketingFraction}
          min={0} max={0.50} step={0.01}
          unit="of revenue"
          description={`~${formatCurrency(decisions.marketingFraction * Math.max(0, state.revenue))}/qtr`}
          onChange={(v) => onUpdateDecisions({ marketingFraction: v })}
          formatter={(v) => `${(v * 100).toFixed(0)}%`}
          disabled={disabled}
        />

        <SliderInput
          label="Hiring"
          value={decisions.hiring}
          min={0} max={500} step={5}
          unit="people/qtr"
          description={`Current: ${state.totalEmployees} employees, need ~${Math.round(state.aircraft * 55)}`}
          onChange={(v) => onUpdateDecisions({ hiring: v })}
          disabled={disabled}
        />

        <SliderInput
          label="Service Scope"
          value={decisions.targetServiceScope}
          min={0.20} max={1.00} step={0.05}
          unit=""
          description="0.2 = bare-bones, 0.6 = low-cost, 1.0 = full-service"
          onChange={(v) => onUpdateDecisions({ targetServiceScope: v })}
          formatter={(v) => v.toFixed(2)}
          disabled={disabled}
        />
      </div>

      {/* Key Indicators */}
      <KeyIndicators state={state} />

      {/* Action buttons */}
      <div className="flex gap-2 mt-auto pt-2">
        {submitMode ? (
          <button
            onClick={onAdvanceQuarter}
            disabled={hasSubmitted || disabled}
            className={`flex-1 py-2.5 font-semibold rounded-lg transition-colors duration-200 text-sm shadow-lg ${
              hasSubmitted
                ? 'bg-green-700 text-green-200 cursor-default shadow-green-500/20'
                : 'bg-cockpit-accent hover:bg-blue-600 text-white shadow-blue-500/20 disabled:bg-gray-600 disabled:shadow-none'
            }`}
          >
            {hasSubmitted ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Decisions Submitted
              </span>
            ) : (
              'Submit Decisions'
            )}
          </button>
        ) : (
          <>
            <button
              onClick={onAdvanceQuarter}
              className="flex-1 py-2.5 bg-cockpit-accent hover:bg-blue-600 text-white font-semibold
                         rounded-lg transition-colors duration-200 text-sm
                         shadow-lg shadow-blue-500/20"
            >
              Advance Quarter
            </button>
            <button
              onClick={onRestart}
              className="px-4 py-2.5 bg-gray-700 hover:bg-gray-600 text-cockpit-muted
                         rounded-lg transition-colors duration-200 text-sm"
            >
              Restart
            </button>
          </>
        )}
      </div>
    </div>
  );
}
