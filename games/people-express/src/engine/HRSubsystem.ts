import {
  DESIRED_EMPLOYEES_PER_AIRCRAFT,
  TRAINING_DELAY_QUARTERS,
  BASE_QUIT_FRACTION,
  MORALE_ADJUSTMENT_TIME,
} from './constants';
import { interpolate, workloadToMorale, moraleToQuitMultiplier } from './lookupTables';

export interface HRState {
  employeesInTraining: number;
  experiencedEmployees: number;
  employeeMorale: number;
}

export interface HRFlows {
  trainingCompletionRate: number;
  quitRate: number;
  workload: number;
  targetMorale: number;
  totalEmployees: number;
  productivity: number;
}

export function computeHRFlows(
  state: HRState,
  aircraft: number,
  targetServiceScope: number
): HRFlows {
  const totalEmployees = state.employeesInTraining + state.experiencedEmployees;

  // Training completion: first-order delay
  const trainingCompletionRate = state.employeesInTraining / TRAINING_DELAY_QUARTERS;

  // Workload: ratio of aircraft to experienced employees (normalized)
  const desiredEmployees = aircraft * DESIRED_EMPLOYEES_PER_AIRCRAFT;
  const workload = desiredEmployees > 0
    ? Math.max(0, aircraft / (state.experiencedEmployees / DESIRED_EMPLOYEES_PER_AIRCRAFT + 0.001))
    : 0;

  // Target morale based on workload and service scope
  const workloadEffect = interpolate(workloadToMorale, workload);
  // Higher service scope with insufficient staff is more stressful
  const scopeStress = 1 - (targetServiceScope - 0.6) * 0.3; // scope 0.6 → 1.0, scope 1.0 → 0.88
  const targetMorale = Math.max(0, Math.min(1, workloadEffect * Math.max(0.5, scopeStress)));

  // Quit rate
  const moraleQuitMultiplier = interpolate(moraleToQuitMultiplier, state.employeeMorale);
  const quitRate = state.experiencedEmployees * BASE_QUIT_FRACTION * moraleQuitMultiplier;

  // Productivity: experienced fraction * morale
  const experiencedFraction = totalEmployees > 0
    ? state.experiencedEmployees / totalEmployees
    : 1;
  const productivity = experiencedFraction * state.employeeMorale;

  return {
    trainingCompletionRate,
    quitRate,
    workload,
    targetMorale,
    totalEmployees,
    productivity,
  };
}

export function updateHRStocks(
  state: HRState,
  flows: HRFlows,
  hiring: number,
  dt: number
): HRState {
  // Morale adjusts toward target with delay
  const moraleChange = (flows.targetMorale - state.employeeMorale) / MORALE_ADJUSTMENT_TIME;

  return {
    employeesInTraining: Math.max(0,
      state.employeesInTraining + (hiring - flows.trainingCompletionRate) * dt
    ),
    experiencedEmployees: Math.max(0,
      state.experiencedEmployees + (flows.trainingCompletionRate - flows.quitRate) * dt
    ),
    employeeMorale: Math.max(0, Math.min(1,
      state.employeeMorale + moraleChange * dt
    )),
  };
}
