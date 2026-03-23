import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface ItemCardProps {
  id: string;
  name: string;
  rank: number;
  nasaRank?: number;
  showNasa?: boolean;
  disabled?: boolean;
}

export default function ItemCard({ id, name, rank, nasaRank, showNasa, disabled }: ItemCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const error = showNasa && nasaRank !== undefined ? Math.abs(rank - nasaRank) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
        isDragging
          ? 'bg-space-accent/20 border-space-accent/50 shadow-lg shadow-space-accent/10 z-50'
          : disabled
            ? 'bg-space-panel/50 border-space-border/50'
            : 'bg-space-panel border-space-border hover:border-space-accent/30 cursor-grab active:cursor-grabbing'
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Rank number */}
      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
        showNasa && error !== null
          ? error === 0
            ? 'bg-green-900/50 text-green-400 border border-green-700/50'
            : error <= 2
              ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700/50'
              : 'bg-red-900/50 text-red-400 border border-red-700/50'
          : 'bg-space-accent/20 text-space-accent border border-space-accent/30'
      }`}>
        {rank}
      </div>

      {/* Item name */}
      <span className="flex-1 text-space-text text-sm">{name}</span>

      {/* NASA rank badge */}
      {showNasa && nasaRank !== undefined && (
        <div className="flex items-center gap-2">
          {error !== null && error > 0 && (
            <span className={`text-xs ${error <= 2 ? 'text-yellow-400' : 'text-red-400'}`}>
              {error > 0 ? `+${error}` : ''}
            </span>
          )}
          <div className="w-7 h-7 rounded-full bg-blue-900/50 text-blue-400 border border-blue-700/50 flex items-center justify-center text-xs font-bold">
            {nasaRank}
          </div>
        </div>
      )}

      {/* Drag handle icon */}
      {!disabled && (
        <svg className="w-4 h-4 text-space-muted/50 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6h2v2H8zm6 0h2v2h-2zM8 11h2v2H8zm6 0h2v2h-2zM8 16h2v2H8zm6 0h2v2h-2z" />
        </svg>
      )}
    </div>
  );
}
