import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import ItemCard from './ItemCard';
import type { SurvivalItem } from '../../types';

interface DraggableRankingListProps {
  items: SurvivalItem[];
  ranking: string[];
  onRankingChange: (newRanking: string[]) => void;
  showNasa?: boolean;
  disabled?: boolean;
}

// Modifiers module might not exist, define inline
const modifiers = [restrictToVerticalAxis];

export default function DraggableRankingList({
  items,
  ranking,
  onRankingChange,
  showNasa = false,
  disabled = false,
}: DraggableRankingListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const itemMap = new Map(items.map(item => [item.id, item]));

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = ranking.indexOf(active.id as string);
    const newIndex = ranking.indexOf(over.id as string);
    onRankingChange(arrayMove(ranking, oldIndex, newIndex));
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      modifiers={modifiers}
    >
      <SortableContext items={ranking} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {ranking.map((itemId, index) => {
            const item = itemMap.get(itemId);
            if (!item) return null;
            return (
              <ItemCard
                key={itemId}
                id={itemId}
                name={item.name}
                rank={index + 1}
                nasaRank={item.nasaRank}
                showNasa={showNasa}
                disabled={disabled}
              />
            );
          })}
        </div>
      </SortableContext>
    </DndContext>
  );
}
