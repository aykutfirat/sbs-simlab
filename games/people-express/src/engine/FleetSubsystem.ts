import {
  AIRCRAFT_DELIVERY_DELAY,
  AIRCRAFT_RETIREMENT_RATE,
  ASM_PER_AIRCRAFT_PER_QUARTER,
} from './constants';

export interface FleetState {
  aircraftOnOrder: number;
  aircraft: number;
}

export interface FleetFlows {
  deliveryRate: number;
  retirementRate: number;
  seatCapacity: number;
  availableSeatMiles: number;
}

export function computeFleetFlows(
  state: FleetState,
  _aircraftPurchases: number
): FleetFlows {
  // First-order material delay: delivery rate = aircraft_on_order / delay
  const deliveryRate = state.aircraftOnOrder / AIRCRAFT_DELIVERY_DELAY;
  const retirementRate = state.aircraft * AIRCRAFT_RETIREMENT_RATE;

  const availableSeatMiles = state.aircraft * ASM_PER_AIRCRAFT_PER_QUARTER;
  const seatCapacity = availableSeatMiles; // simplified

  return { deliveryRate, retirementRate, seatCapacity, availableSeatMiles };
}

export function updateFleetStocks(
  state: FleetState,
  flows: FleetFlows,
  aircraftPurchases: number,
  dt: number
): FleetState {
  return {
    aircraftOnOrder: Math.max(0,
      state.aircraftOnOrder + (aircraftPurchases - flows.deliveryRate) * dt
    ),
    aircraft: Math.max(0,
      state.aircraft + (flows.deliveryRate - flows.retirementRate) * dt
    ),
  };
}
