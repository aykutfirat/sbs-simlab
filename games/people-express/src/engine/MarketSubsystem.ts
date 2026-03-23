import {
  MAX_LOAD_FACTOR,
  BASE_COMPETITOR_FARE,
  COMPETITOR_FARE_FLOOR,
  AWARENESS_DECAY_RATE,
  REFERENCE_MARKETING_SPEND,
  MARKET_GROWTH_RATE,
  PASSENGER_SMOOTH_TIME,
} from './constants';
import {
  interpolate,
  fareRatioToDemand,
  reputationToDemand,
  marketShareToCompetitorResponse,
} from './lookupTables';

export interface MarketState {
  pePassengers: number;
  marketAwareness: number;
  competitorFare: number;
  totalMarket: number;
}

export interface MarketFlows {
  potentialDemand: number;
  actualDemand: number;
  fareAttractiveness: number;
  reputationEffect: number;
  peMarketShare: number;
  loadFactor: number;
}

export function computeMarketFlows(
  state: MarketState,
  peFare: number,
  serviceReputation: number,
  _serviceQuality: number,
  availableSeatMiles: number,
  _marketingSpend: number,
  pePassengers: number
): MarketFlows {
  // Fare attractiveness using lookup table
  const fareRatio = peFare / Math.max(0.01, state.competitorFare);
  const rawFareAttractiveness = interpolate(fareRatioToDemand, fareRatio);

  // Reputation effect on demand
  const reputationEffect = interpolate(reputationToDemand, serviceReputation);

  // Fare advantage is dampened by poor reputation
  // With terrible reputation, even cheap fares don't attract customers
  const reputationDamping = 0.3 + 0.7 * serviceReputation; // 0.3 at rep=0, 1.0 at rep=1
  const fareAttractiveness = 1.0 + (rawFareAttractiveness - 1.0) * reputationDamping;

  // Market share (cap at 50% — competitors always retain their loyal customers)
  const peMarketShare = state.totalMarket > 0
    ? Math.min(0.50, pePassengers / state.totalMarket)
    : 0;

  // Market saturation: diminishing returns at high share
  const saturationFactor = 1.0 - peMarketShare * 0.6;

  // Potential demand
  const potentialDemand = state.totalMarket * state.marketAwareness
    * fareAttractiveness * reputationEffect * saturationFactor;

  // Actual demand constrained by capacity
  const maxCapacityDemand = availableSeatMiles * MAX_LOAD_FACTOR;
  const actualDemand = Math.min(potentialDemand, maxCapacityDemand);

  // Load factor
  const loadFactor = availableSeatMiles > 0
    ? pePassengers / availableSeatMiles
    : 0;

  return {
    potentialDemand,
    actualDemand,
    fareAttractiveness,
    reputationEffect,
    peMarketShare,
    loadFactor,
  };
}

export function updateMarketStocks(
  state: MarketState,
  flows: MarketFlows,
  marketingSpend: number,
  serviceQuality: number,
  pePassengers: number,
  dt: number
): MarketState {
  // Market awareness dynamics
  const marketingEffect = marketingSpend / REFERENCE_MARKETING_SPEND;
  const wordOfMouth = state.totalMarket > 0
    ? (pePassengers / state.totalMarket) * serviceQuality * 0.5
    : 0;
  const awarenessGrowth = (marketingEffect * 0.1 + wordOfMouth) * (1 - state.marketAwareness);
  const awarenessDecay = AWARENESS_DECAY_RATE * state.marketAwareness;
  const newAwareness = Math.max(0, Math.min(1,
    state.marketAwareness + (awarenessGrowth - awarenessDecay) * dt
  ));

  // Passengers smooth toward actual demand
  const passengerChange = (flows.actualDemand - state.pePassengers) / PASSENGER_SMOOTH_TIME;
  const newPassengers = Math.max(0,
    state.pePassengers + passengerChange * dt
  );

  // Competitor fare responds to PE market share
  const competitiveResponse = interpolate(marketShareToCompetitorResponse, flows.peMarketShare);
  const targetCompetitorFare = Math.max(
    COMPETITOR_FARE_FLOOR,
    BASE_COMPETITOR_FARE * (1 - competitiveResponse)
  );
  const competitorFareChange = (targetCompetitorFare - state.competitorFare) / 2;
  const newCompetitorFare = Math.max(COMPETITOR_FARE_FLOOR,
    state.competitorFare + competitorFareChange * dt
  );

  // Total market grows with baseline + stimulation from low fares
  const avgFare = (state.competitorFare + 0.16) / 2;
  const fareStimulation = Math.max(0, (0.16 - avgFare) / 0.16) * 0.02;
  const marketGrowth = (MARKET_GROWTH_RATE + fareStimulation) * state.totalMarket;
  const newTotalMarket = state.totalMarket + marketGrowth * dt;

  return {
    pePassengers: newPassengers,
    marketAwareness: newAwareness,
    competitorFare: newCompetitorFare,
    totalMarket: newTotalMarket,
  };
}
