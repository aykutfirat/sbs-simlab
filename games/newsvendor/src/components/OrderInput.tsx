import { useState } from 'react';
import { MAX_ORDER, MIN_ORDER } from '../engine/constants';

interface OrderInputProps {
  onSubmit: (order: number) => void;
  disabled: boolean;
  currentDay: number;
}

export function OrderInput({ onSubmit, disabled, currentDay }: OrderInputProps) {
  const [order, setOrder] = useState(100);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOrder(parseInt(e.target.value, 10));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val)) {
      setOrder(Math.max(MIN_ORDER, Math.min(MAX_ORDER, val)));
    }
  };

  const handleSubmit = () => {
    if (!disabled) {
      onSubmit(order);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !disabled) {
      onSubmit(order);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border border-bagel-100">
      <h2 className="text-lg font-bold text-bagel-800 mb-1">
        Day {currentDay} — Place Your Order
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        How many bagels should we bake today?
      </p>

      <div className="flex items-center gap-4 mb-4">
        <input
          type="range"
          min={MIN_ORDER}
          max={MAX_ORDER}
          value={order}
          onChange={handleSliderChange}
          disabled={disabled}
          className="flex-1 h-2 bg-bagel-100 rounded-lg appearance-none cursor-pointer accent-bagel-500 disabled:opacity-50"
        />
        <input
          type="number"
          min={MIN_ORDER}
          max={MAX_ORDER}
          value={order}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          className="w-24 px-3 py-2 text-center text-xl font-bold border-2 border-bagel-200 rounded-lg focus:outline-none focus:border-bagel-400 disabled:opacity-50"
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={disabled}
        className="w-full py-3 bg-bagel-600 hover:bg-bagel-700 text-white font-bold rounded-lg shadow transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
      >
        Place Order — {order} Bagels
      </button>
    </div>
  );
}
