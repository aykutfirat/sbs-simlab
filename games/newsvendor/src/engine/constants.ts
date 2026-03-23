import { GameConfig } from '../types';

export const DIFFICULTY_PRESETS: Record<'easy' | 'medium' | 'hard', Omit<GameConfig, 'seed' | 'mode'>> = {
  easy: {
    price: 6.0,
    cost: 2.0,
    salvage: 0.5,
    mu: 100,
    sigma: 15,
    rounds: 30,
  },
  medium: {
    price: 6.0,
    cost: 2.0,
    salvage: 0.5,
    mu: 100,
    sigma: 30,
    rounds: 30,
  },
  hard: {
    price: 6.0,
    cost: 2.0,
    salvage: 0.5,
    mu: 100,
    sigma: 45,
    rounds: 30,
  },
};

export const MAX_ORDER = 300;
export const MIN_ORDER = 0;
