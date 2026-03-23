import type { MarketEvent } from '../types';

export const MARKET_EVENTS: MarketEvent[] = [
  {
    type: 'new-entrant-rumor',
    name: 'New Entrant Rumor',
    description: 'Rumors of a new competitor entering the market. Customers become 30% more price-sensitive for 2 rounds.',
    roundTriggered: 0,
    duration: 2,
  },
  {
    type: 'tech-breakthrough',
    name: 'Tech Breakthrough',
    description: 'One random firm receives a major technology upgrade — +15 quality for free!',
    roundTriggered: 0,
    duration: 1,
  },
  {
    type: 'recession',
    name: 'Recession',
    description: 'Economic downturn hits. Total market demand shrinks by 20% for 3 rounds.',
    roundTriggered: 0,
    duration: 3,
  },
  {
    type: 'viral-review',
    name: 'Viral Review',
    description: 'The firm with the highest quality gets a viral positive review — +0.2 brand awareness.',
    roundTriggered: 0,
    duration: 1,
  },
  {
    type: 'data-breach',
    name: 'Data Breach Scandal',
    description: 'The firm that invested least in quality this round suffers a data breach — loses 0.15 brand awareness.',
    roundTriggered: 0,
    duration: 1,
  },
  {
    type: 'price-transparency',
    name: 'Price Transparency Law',
    description: 'New regulation requires all prices to be publicly visible before decisions. Info mode switches to Full for 1 round.',
    roundTriggered: 0,
    duration: 1,
  },
];

/**
 * Pick random events for auto-scheduling in a game.
 * Returns 2-3 events spread across the game timeline.
 */
export function scheduleRandomEvents(totalRounds: number): MarketEvent[] {
  if (totalRounds < 8) return [];

  const count = totalRounds >= 16 ? 3 : 2;
  const available = [...MARKET_EVENTS];
  const selected: MarketEvent[] = [];

  // Space events out across the middle portion of the game
  const startRound = Math.floor(totalRounds * 0.2);
  const endRound = Math.floor(totalRounds * 0.8);
  const spacing = Math.floor((endRound - startRound) / count);

  for (let i = 0; i < count; i++) {
    const idx = Math.floor(Math.random() * available.length);
    const event = { ...available[idx] };
    event.roundTriggered = startRound + i * spacing + Math.floor(Math.random() * 2);
    selected.push(event);
    available.splice(idx, 1);
    if (available.length === 0) break;
  }

  return selected;
}
