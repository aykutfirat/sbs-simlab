import {
  DESIRED_EMPLOYEES_PER_AIRCRAFT,
  REPUTATION_BUILD_TIME,
  REPUTATION_DECAY_TIME,
} from './constants';

export interface ServiceState {
  serviceQuality: number;
  serviceReputation: number;
}

export interface ServiceFlows {
  staffAdequacy: number;
}

export function computeServiceQuality(
  experiencedEmployees: number,
  totalEmployees: number,
  aircraft: number,
  morale: number,
  targetServiceScope: number
): number {
  const desiredStaff = aircraft * DESIRED_EMPLOYEES_PER_AIRCRAFT;
  // Staff adequacy based on experienced employees vs need
  const staffAdequacy = desiredStaff > 0
    ? Math.min(1.0, experiencedEmployees / desiredStaff)
    : 1.0;

  // Experienced fraction matters: lots of trainees reduce quality
  const experiencedFraction = totalEmployees > 0
    ? experiencedEmployees / totalEmployees
    : 1.0;
  // Trainee drag: quality multiplier from 0.6 (all trainees) to 1.0 (all experienced)
  const traineeDrag = 0.6 + 0.4 * experiencedFraction;

  // Service scope: higher scope = harder to maintain quality
  // scope 0.2 → divisor 0.6, scope 0.6 → divisor 0.8, scope 1.0 → divisor 1.0
  const scopeDivisor = 0.4 + 0.6 * targetServiceScope;

  const rawQuality = staffAdequacy * morale * traineeDrag / scopeDivisor;

  return Math.max(0, Math.min(1, rawQuality));
}

export function updateServiceStocks(
  state: ServiceState,
  serviceQuality: number,
  dt: number
): ServiceState {
  // Reputation asymmetric adjustment
  const adjustmentTime = serviceQuality < state.serviceReputation
    ? REPUTATION_DECAY_TIME   // bad news travels fast
    : REPUTATION_BUILD_TIME;  // good news is slow

  const reputationChange = (serviceQuality - state.serviceReputation) / adjustmentTime;

  return {
    serviceQuality,
    serviceReputation: Math.max(0, Math.min(1,
      state.serviceReputation + reputationChange * dt
    )),
  };
}
