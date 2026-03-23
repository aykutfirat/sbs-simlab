import { useState, useCallback, useMemo } from 'react';
import { GameState, GameConfig, RoundResult } from '../types';
import { generateDemand } from '../engine/DemandGenerator';
import { calculateRound } from '../engine/GameEngine';
import { DIFFICULTY_PRESETS } from '../engine/constants';
import { dateSeed } from '../utils/seededRng';

function parseURLParams(): Partial<GameConfig> & { hideDebrief?: boolean } {
  const params = new URLSearchParams(window.location.search);
  const result: Partial<GameConfig> & { hideDebrief?: boolean } = {};

  const mode = params.get('mode');
  if (mode === 'easy' || mode === 'medium' || mode === 'hard') {
    result.mode = mode;
  }

  const seed = params.get('seed');
  if (seed) result.seed = parseInt(seed, 10);

  const mu = params.get('mu');
  if (mu) result.mu = parseFloat(mu);

  const sigma = params.get('sigma');
  if (sigma) result.sigma = parseFloat(sigma);

  const price = params.get('price');
  if (price) result.price = parseFloat(price);

  const cost = params.get('cost');
  if (cost) result.cost = parseFloat(cost);

  const salvage = params.get('salvage');
  if (salvage) result.salvage = parseFloat(salvage);

  const rounds = params.get('rounds');
  if (rounds) result.rounds = parseInt(rounds, 10);

  const hideDebrief = params.get('hideDebrief');
  if (hideDebrief === 'true') result.hideDebrief = true;

  // Detect custom mode if individual params are set
  if (result.mu || result.sigma || result.price || result.cost || result.salvage) {
    result.mode = 'custom';
  }

  return result;
}

function buildConfig(mode: 'easy' | 'medium' | 'hard', seed?: number): GameConfig {
  const urlParams = parseURLParams();
  const preset = DIFFICULTY_PRESETS[urlParams.mode && urlParams.mode !== 'custom' ? urlParams.mode : mode];

  const config: GameConfig = {
    ...preset,
    mode: urlParams.mode || mode,
    seed: urlParams.seed ?? seed ?? dateSeed(),
  };

  // Override with any custom URL params
  if (urlParams.mu !== undefined) config.mu = urlParams.mu;
  if (urlParams.sigma !== undefined) config.sigma = urlParams.sigma;
  if (urlParams.price !== undefined) config.price = urlParams.price;
  if (urlParams.cost !== undefined) config.cost = urlParams.cost;
  if (urlParams.salvage !== undefined) config.salvage = urlParams.salvage;
  if (urlParams.rounds !== undefined) config.rounds = urlParams.rounds;

  return config;
}

export function useGameState() {
  const [state, setState] = useState<GameState>({
    config: buildConfig('medium'),
    demands: [],
    rounds: [],
    currentDay: 1,
    cumulativeProfit: 0,
    phase: 'start',
    pendingOrder: null,
    showingResult: false,
  });

  const hideDebrief = useMemo(() => {
    return parseURLParams().hideDebrief === true;
  }, []);

  const startGame = useCallback((mode: 'easy' | 'medium' | 'hard', seed?: number) => {
    const config = buildConfig(mode, seed);
    const demands = generateDemand(config.seed, config.rounds, config.mu, config.sigma);

    setState({
      config,
      demands,
      rounds: [],
      currentDay: 1,
      cumulativeProfit: 0,
      phase: 'playing',
      pendingOrder: null,
      showingResult: false,
    });
  }, []);

  const submitOrder = useCallback((order: number) => {
    setState((prev) => {
      if (prev.showingResult) return prev;

      const demand = prev.demands[prev.currentDay - 1];
      const result = calculateRound(
        prev.config,
        prev.currentDay,
        order,
        demand,
        prev.cumulativeProfit
      );

      return {
        ...prev,
        pendingOrder: order,
        showingResult: true,
        rounds: [...prev.rounds, result],
        cumulativeProfit: result.cumulativeProfit,
      };
    });
  }, []);

  const nextDay = useCallback(() => {
    setState((prev) => {
      const nextDayNum = prev.currentDay + 1;
      const isGameOver = nextDayNum > prev.config.rounds;

      return {
        ...prev,
        currentDay: isGameOver ? prev.currentDay : nextDayNum,
        pendingOrder: null,
        showingResult: false,
        phase: isGameOver ? (hideDebrief ? 'playing' : 'debrief') : 'playing',
      };
    });
  }, [hideDebrief]);

  const resetGame = useCallback(() => {
    setState({
      config: buildConfig('medium'),
      demands: [],
      rounds: [],
      currentDay: 1,
      cumulativeProfit: 0,
      phase: 'start',
      pendingOrder: null,
      showingResult: false,
    });
  }, []);

  return {
    state,
    startGame,
    submitOrder,
    nextDay,
    resetGame,
    hideDebrief,
  };
}
