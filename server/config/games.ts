export interface GameConfig {
  slug: string;
  name: string;
  description: string;
  type: 'single-player' | 'multiplayer';
  needsSocketIO: boolean;
  icon: string;
  status: 'active' | 'coming-soon';
}

export const games: GameConfig[] = [
  {
    slug: 'beer-game',
    name: 'MIT Beer Distribution Game',
    description: 'Experience the bullwhip effect in a 4-player supply chain simulation.',
    type: 'multiplayer',
    needsSocketIO: true,
    icon: '🍺',
    status: 'active',
  },
  {
    slug: 'people-express',
    name: 'People Express Airline Simulator',
    description: 'Manage a startup airline through growth and crisis — can you avoid bankruptcy?',
    type: 'multiplayer',
    needsSocketIO: true,
    icon: '✈️',
    status: 'active',
  },
  {
    slug: 'newsvendor',
    name: 'Bay Bagels — The Newsvendor Challenge',
    description: 'How many bagels should you order? Balance waste vs. lost sales under uncertainty.',
    type: 'multiplayer',
    needsSocketIO: true,
    icon: '🥯',
    status: 'active',
  },
  {
    slug: 'moon-survival',
    name: 'NASA Moon Survival',
    description: 'Rank survival items individually, then as a team. Discover why groups outperform individuals.',
    type: 'multiplayer',
    needsSocketIO: true,
    icon: '🌙',
    status: 'active',
  },
];
