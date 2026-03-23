import { SimulationState, PlayerDecisions } from '../types';
import {
  STEPS_PER_QUARTER,
  DT,
  INITIAL_STATE,
  AIRCRAFT_ACQUISITION_COST,
  EMPLOYEE_COST_PER_QUARTER,
} from './constants';
import { FleetState, computeFleetFlows, updateFleetStocks } from './FleetSubsystem';
import { HRState, computeHRFlows, updateHRStocks } from './HRSubsystem';
import { computeServiceQuality, ServiceState, updateServiceStocks } from './ServiceSubsystem';
import { MarketState, computeMarketFlows, updateMarketStocks } from './MarketSubsystem';
import { FinancialState, computeFinancialFlows, updateFinancialStocks } from './FinancialSubsystem';

// Internal state used during integration (more detailed than SimulationState)
interface InternalState {
  fleet: FleetState;
  hr: HRState;
  service: ServiceState;
  market: MarketState;
  financial: FinancialState;
}

function initInternalState(): InternalState {
  return {
    fleet: {
      aircraftOnOrder: INITIAL_STATE.aircraftOnOrder,
      aircraft: INITIAL_STATE.aircraft,
    },
    hr: {
      employeesInTraining: INITIAL_STATE.employeesInTraining,
      experiencedEmployees: INITIAL_STATE.experiencedEmployees,
      employeeMorale: INITIAL_STATE.employeeMorale,
    },
    service: {
      serviceQuality: INITIAL_STATE.serviceQuality,
      serviceReputation: INITIAL_STATE.serviceReputation,
    },
    market: {
      pePassengers: INITIAL_STATE.pePassengers,
      marketAwareness: INITIAL_STATE.marketAwareness,
      competitorFare: INITIAL_STATE.competitorFare,
      totalMarket: INITIAL_STATE.totalMarket,
    },
    financial: {
      cash: INITIAL_STATE.cash,
      cumulativeProfit: INITIAL_STATE.cumulativeProfit,
      stockPrice: INITIAL_STATE.stockPrice,
      smoothedNetIncome: 0,
      previousRevenue: 0,
    },
  };
}

function internalToSimState(
  internal: InternalState,
  quarter: number,
  decisions: PlayerDecisions,
  lastFlows: {
    revenue: number;
    totalCosts: number;
    netIncome: number;
    aircraftCosts: number;
    employeeCosts: number;
    marketingCosts: number;
    overheadCosts: number;
    aircraftPurchaseCosts: number;
    workload: number;
    quitRate: number;
    productivity: number;
    potentialDemand: number;
    loadFactor: number;
    peMarketShare: number;
    fareAttractiveness: number;
    seatCapacity: number;
    availableSeatMiles: number;
  }
): SimulationState {
  const year = Math.ceil(quarter / 4);
  const quarterInYear = quarter > 0 ? ((quarter - 1) % 4) + 1 : 0;

  return {
    quarter,
    year,
    quarterInYear,

    // Fleet
    aircraftOnOrder: internal.fleet.aircraftOnOrder,
    aircraft: Math.round(internal.fleet.aircraft * 10) / 10,
    seatCapacity: lastFlows.seatCapacity,
    availableSeatMiles: lastFlows.availableSeatMiles,

    // HR
    employeesInTraining: Math.round(internal.hr.employeesInTraining),
    experiencedEmployees: Math.round(internal.hr.experiencedEmployees),
    totalEmployees: Math.round(internal.hr.employeesInTraining + internal.hr.experiencedEmployees),
    employeeMorale: internal.hr.employeeMorale,
    workload: lastFlows.workload,
    quitRate: lastFlows.quitRate,
    productivity: lastFlows.productivity,

    // Service
    serviceQuality: internal.service.serviceQuality,
    serviceReputation: internal.service.serviceReputation,

    // Market
    pePassengers: internal.market.pePassengers,
    marketAwareness: internal.market.marketAwareness,
    potentialDemand: lastFlows.potentialDemand,
    loadFactor: lastFlows.loadFactor,
    peMarketShare: lastFlows.peMarketShare,
    competitorFare: internal.market.competitorFare,
    totalMarket: internal.market.totalMarket,
    fareAttractiveness: lastFlows.fareAttractiveness,

    // Financial
    cash: internal.financial.cash,
    cumulativeProfit: internal.financial.cumulativeProfit,
    stockPrice: internal.financial.stockPrice,
    revenue: lastFlows.revenue,
    totalCosts: lastFlows.totalCosts,
    netIncome: lastFlows.netIncome,
    aircraftCosts: lastFlows.aircraftCosts,
    employeeCosts: lastFlows.employeeCosts,
    marketingCosts: lastFlows.marketingCosts,
    overheadCosts: lastFlows.overheadCosts,
    aircraftPurchaseCosts: lastFlows.aircraftPurchaseCosts,

    // Status
    isBankrupt: internal.financial.cash < -10_000_000,
    isGameOver: quarter >= 40 || internal.financial.cash < -10_000_000,

    decisions,
  };
}

export class SimulationEngine {
  private internal: InternalState;
  private currentQuarter: number;

  constructor() {
    this.internal = initInternalState();
    this.currentQuarter = 0;
  }

  getInitialState(): SimulationState {
    const fleetFlows = computeFleetFlows(this.internal.fleet, 0);
    const hrFlows = computeHRFlows(this.internal.hr, this.internal.fleet.aircraft, 0.6);
    const defaultDecisions: PlayerDecisions = {
      aircraftPurchases: 0,
      peopleFare: 0.09,
      marketingFraction: 0.10,
      hiring: 9,
      targetServiceScope: 0.60,
    };
    return internalToSimState(this.internal, 0, defaultDecisions, {
      revenue: 0,
      totalCosts: 0,
      netIncome: 0,
      aircraftCosts: 0,
      employeeCosts: 0,
      marketingCosts: 0,
      overheadCosts: 0,
      aircraftPurchaseCosts: 0,
      workload: hrFlows.workload,
      quitRate: hrFlows.quitRate,
      productivity: hrFlows.productivity,
      potentialDemand: 0,
      loadFactor: 0,
      peMarketShare: 0.02,
      fareAttractiveness: 1,
      seatCapacity: fleetFlows.seatCapacity,
      availableSeatMiles: fleetFlows.availableSeatMiles,
    });
  }

  // Enforce cash constraints on decisions
  private constrainDecisions(decisions: PlayerDecisions): PlayerDecisions {
    const constrained = { ...decisions };

    // If cash is very low, reduce purchases and hiring
    if (this.internal.financial.cash < 0) {
      constrained.aircraftPurchases = Math.min(constrained.aircraftPurchases,
        Math.max(0, Math.floor((this.internal.financial.cash + 5_000_000) / AIRCRAFT_ACQUISITION_COST)));
      constrained.hiring = Math.min(constrained.hiring,
        Math.max(0, Math.floor((this.internal.financial.cash + 2_000_000) / EMPLOYEE_COST_PER_QUARTER)));
    }

    // Clamp all values to valid ranges
    constrained.aircraftPurchases = Math.max(0, Math.min(20, Math.round(constrained.aircraftPurchases)));
    constrained.peopleFare = Math.max(0.03, Math.min(0.25, constrained.peopleFare));
    constrained.marketingFraction = Math.max(0, Math.min(0.50, constrained.marketingFraction));
    constrained.hiring = Math.max(0, Math.min(500, Math.round(constrained.hiring)));
    constrained.targetServiceScope = Math.max(0.20, Math.min(1.00, constrained.targetServiceScope));

    return constrained;
  }

  advanceQuarter(rawDecisions: PlayerDecisions): SimulationState {
    const decisions = this.constrainDecisions(rawDecisions);
    this.currentQuarter++;

    let lastFlows = {
      revenue: 0,
      totalCosts: 0,
      netIncome: 0,
      aircraftCosts: 0,
      employeeCosts: 0,
      marketingCosts: 0,
      overheadCosts: 0,
      aircraftPurchaseCosts: 0,
      workload: 1,
      quitRate: 0,
      productivity: 1,
      potentialDemand: 0,
      loadFactor: 0,
      peMarketShare: 0,
      fareAttractiveness: 1,
      seatCapacity: 0,
      availableSeatMiles: 0,
    };

    // Run Euler integration for one quarter
    for (let step = 0; step < STEPS_PER_QUARTER; step++) {
      // 1. Compute all flows
      const fleetFlows = computeFleetFlows(this.internal.fleet, decisions.aircraftPurchases);

      const hrFlows = computeHRFlows(
        this.internal.hr,
        this.internal.fleet.aircraft,
        decisions.targetServiceScope
      );

      const serviceQuality = computeServiceQuality(
        this.internal.hr.experiencedEmployees,
        this.internal.hr.employeesInTraining + this.internal.hr.experiencedEmployees,
        this.internal.fleet.aircraft,
        this.internal.hr.employeeMorale,
        decisions.targetServiceScope
      );

      const marketingSpend = decisions.marketingFraction * Math.max(0, this.internal.financial.previousRevenue);

      const marketFlows = computeMarketFlows(
        this.internal.market,
        decisions.peopleFare,
        this.internal.service.serviceReputation,
        serviceQuality,
        fleetFlows.availableSeatMiles,
        marketingSpend,
        this.internal.market.pePassengers
      );

      const financialFlows = computeFinancialFlows(
        this.internal.financial,
        this.internal.market.pePassengers,
        decisions.peopleFare,
        this.internal.fleet.aircraft,
        fleetFlows.deliveryRate,
        hrFlows.totalEmployees,
        decisions.marketingFraction,
        DT
      );

      // 2. Update all stocks
      this.internal.fleet = updateFleetStocks(
        this.internal.fleet, fleetFlows, decisions.aircraftPurchases, DT
      );

      this.internal.hr = updateHRStocks(
        this.internal.hr, hrFlows, decisions.hiring, DT
      );

      this.internal.service = updateServiceStocks(
        { serviceQuality, serviceReputation: this.internal.service.serviceReputation },
        serviceQuality,
        DT
      );

      this.internal.market = updateMarketStocks(
        this.internal.market,
        marketFlows,
        marketingSpend,
        serviceQuality,
        this.internal.market.pePassengers,
        DT
      );

      this.internal.financial = updateFinancialStocks(
        this.internal.financial,
        financialFlows,
        DT
      );

      // Store last flows for output
      lastFlows = {
        revenue: financialFlows.revenue,
        totalCosts: financialFlows.totalCosts,
        netIncome: financialFlows.netIncome,
        aircraftCosts: financialFlows.aircraftOperatingCosts,
        employeeCosts: financialFlows.employeeCosts,
        marketingCosts: financialFlows.marketingCosts,
        overheadCosts: financialFlows.overheadCosts,
        aircraftPurchaseCosts: financialFlows.aircraftPurchaseCosts,
        workload: hrFlows.workload,
        quitRate: hrFlows.quitRate,
        productivity: hrFlows.productivity,
        potentialDemand: marketFlows.potentialDemand,
        loadFactor: marketFlows.loadFactor,
        peMarketShare: marketFlows.peMarketShare,
        fareAttractiveness: marketFlows.fareAttractiveness,
        seatCapacity: fleetFlows.seatCapacity,
        availableSeatMiles: fleetFlows.availableSeatMiles,
      };
    }

    return internalToSimState(this.internal, this.currentQuarter, decisions, lastFlows);
  }

  // Reset engine to initial state
  reset(): void {
    this.internal = initInternalState();
    this.currentQuarter = 0;
  }

  // Clone current state for simulation testing
  getCurrentQuarter(): number {
    return this.currentQuarter;
  }
}

// Run a full simulation with fixed decisions (for testing/calibration)
export function runFullSimulation(
  decisions: PlayerDecisions,
  quarters: number = 40
): SimulationState[] {
  const engine = new SimulationEngine();
  const results: SimulationState[] = [engine.getInitialState()];

  for (let q = 0; q < quarters; q++) {
    const state = engine.advanceQuarter(decisions);
    results.push(state);
    if (state.isBankrupt) break;
  }

  return results;
}
