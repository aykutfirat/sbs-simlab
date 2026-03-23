import {
  AIRCRAFT_OPERATING_COST_PER_QUARTER,
  AIRCRAFT_ACQUISITION_COST,
  EMPLOYEE_COST_PER_QUARTER,
  FIXED_OVERHEAD_PER_QUARTER,
  OVERHEAD_PER_AIRCRAFT,
  BANKRUPTCY_THRESHOLD,
  SHARES_OUTSTANDING,
  EARNINGS_MULTIPLE,
  STOCK_PRICE_SMOOTH_TIME,
} from './constants';

export interface FinancialState {
  cash: number;
  cumulativeProfit: number;
  stockPrice: number;
  // Smoothed values for stock price calc
  smoothedNetIncome: number;
  previousRevenue: number;
}

export interface FinancialFlows {
  revenue: number;
  aircraftOperatingCosts: number;
  aircraftPurchaseCosts: number;
  employeeCosts: number;
  marketingCosts: number;
  overheadCosts: number;
  totalCosts: number;
  netIncome: number;
  isBankrupt: boolean;
}

export function computeFinancialFlows(
  state: FinancialState,
  pePassengers: number,
  peFare: number,
  aircraft: number,
  deliveryRate: number,
  totalEmployees: number,
  marketingFraction: number,
  _dt: number
): FinancialFlows {
  // Revenue
  const revenue = pePassengers * peFare;

  // Costs (all per quarter)
  const aircraftOperatingCosts = aircraft * AIRCRAFT_OPERATING_COST_PER_QUARTER;
  const aircraftPurchaseCosts = deliveryRate * AIRCRAFT_ACQUISITION_COST; // paid on delivery
  const employeeCosts = totalEmployees * EMPLOYEE_COST_PER_QUARTER;
  const marketingCosts = marketingFraction * Math.max(0, state.previousRevenue);
  const overheadCosts = FIXED_OVERHEAD_PER_QUARTER + aircraft * OVERHEAD_PER_AIRCRAFT;

  const totalCosts = aircraftOperatingCosts + aircraftPurchaseCosts + employeeCosts + marketingCosts + overheadCosts;
  const netIncome = revenue - totalCosts;

  const isBankrupt = state.cash < BANKRUPTCY_THRESHOLD;

  return {
    revenue,
    aircraftOperatingCosts,
    aircraftPurchaseCosts,
    employeeCosts,
    marketingCosts,
    overheadCosts,
    totalCosts,
    netIncome,
    isBankrupt,
  };
}

export function updateFinancialStocks(
  state: FinancialState,
  flows: FinancialFlows,
  dt: number
): FinancialState {
  const newCash = state.cash + flows.netIncome * dt;
  const newCumulativeProfit = state.cumulativeProfit + flows.netIncome * dt;

  // Smoothed net income for stock price
  const smoothedNetIncomeChange = (flows.netIncome - state.smoothedNetIncome) / STOCK_PRICE_SMOOTH_TIME;
  const newSmoothedNetIncome = state.smoothedNetIncome + smoothedNetIncomeChange * dt;

  // Stock price model
  const baseValue = Math.max(0, newCash / SHARES_OUTSTANDING * 0.5);
  const earningsComponent = EARNINGS_MULTIPLE * Math.max(0, newSmoothedNetIncome) / SHARES_OUTSTANDING;

  // Growth premium based on revenue trajectory
  const revenueGrowth = state.previousRevenue > 0
    ? (flows.revenue - state.previousRevenue) / state.previousRevenue
    : 0;
  const growthPremium = Math.max(0, revenueGrowth * 5); // reward growth

  const targetStockPrice = Math.max(0, baseValue + earningsComponent + growthPremium);
  const stockPriceChange = (targetStockPrice - state.stockPrice) / STOCK_PRICE_SMOOTH_TIME;
  const newStockPrice = Math.max(0, state.stockPrice + stockPriceChange * dt);

  return {
    cash: newCash,
    cumulativeProfit: newCumulativeProfit,
    stockPrice: newStockPrice,
    smoothedNetIncome: newSmoothedNetIncome,
    previousRevenue: flows.revenue,
  };
}
