// Model constants for People Express Simulator
// Calibrated to reproduce PE's 1981-1986 trajectory

// Time
export const TOTAL_QUARTERS = 40;
export const DT = 0.0625;  // 1/16 quarter for Euler integration
export const STEPS_PER_QUARTER = Math.round(1 / DT); // 16

// Fleet
export const SEATS_PER_AIRCRAFT = 200;
// Available seat-miles per aircraft per quarter
// Based on: 200 seats × ~5 flights/day × 800 mi avg × 90 days = ~72M
// But PE operated shorter routes, so use ~20M as effective ASM/aircraft/quarter
export const ASM_PER_AIRCRAFT_PER_QUARTER = 20_000_000;
export const AIRCRAFT_DELIVERY_DELAY = 2; // quarters
export const AIRCRAFT_LIFE_QUARTERS = 60;
export const AIRCRAFT_RETIREMENT_RATE = 1 / AIRCRAFT_LIFE_QUARTERS;
// PE primarily leased aircraft. This represents lease deposit + setup costs.
export const AIRCRAFT_ACQUISITION_COST = 1_500_000; // $1.5M per aircraft (lease deposit + setup)
// Operating cost includes lease payments, fuel, maintenance
export const AIRCRAFT_OPERATING_COST_PER_QUARTER = 600_000; // $600K/qtr/aircraft

// HR
export const DESIRED_EMPLOYEES_PER_AIRCRAFT = 55;
export const TRAINING_DELAY_QUARTERS = 1;
export const BASE_QUIT_FRACTION = 0.05; // per quarter (~20% annual)
export const EMPLOYEE_COST_PER_QUARTER = 10_000; // $10K/qtr/employee

// Market
// US domestic market ~200B RPM/year in 1981, regional/accessible market smaller
export const MARKET_GROWTH_RATE = 0.03 / 4; // 3%/year = ~0.75%/qtr
export const FARE_ELASTICITY = 1.5;
export const MAX_LOAD_FACTOR = 0.95;
export const BASE_COMPETITOR_FARE = 0.16; // $/seat-mile
export const COMPETITOR_FARE_FLOOR = 0.10;
export const COMPETITOR_RESPONSE_DELAY = 2; // quarters
export const AWARENESS_DECAY_RATE = 0.05; // per quarter
export const REFERENCE_MARKETING_SPEND = 500_000; // $500K/qtr baseline

// Financial
export const FIXED_OVERHEAD_PER_QUARTER = 100_000; // $100K
export const OVERHEAD_PER_AIRCRAFT = 30_000; // $30K/aircraft
export const BANKRUPTCY_THRESHOLD = -10_000_000; // -$10M
export const SHARES_OUTSTANDING = 1_000_000;
export const EARNINGS_MULTIPLE = 8;

// Smoothing time constants
export const MORALE_ADJUSTMENT_TIME = 2; // quarters
export const REPUTATION_BUILD_TIME = 6; // quarters (good news)
export const REPUTATION_DECAY_TIME = 2; // quarters (bad news)
export const PASSENGER_SMOOTH_TIME = 1; // quarter
export const STOCK_PRICE_SMOOTH_TIME = 2; // quarters

// Initial conditions
export const INITIAL_STATE = {
  aircraft: 3,
  aircraftOnOrder: 0,
  experiencedEmployees: 165,
  employeesInTraining: 0,
  cash: 25_000_000,           // $25M (PE raised ~$25M in initial capital)
  stockPrice: 1.88,
  serviceQuality: 1.0,
  serviceReputation: 0.5,
  employeeMorale: 0.8,
  marketAwareness: 0.15,
  pePassengers: 40_000_000,   // 40M seat-miles/qtr (~2% of 2B market)
  competitorFare: 0.16,
  totalMarket: 2_000_000_000, // 2B seat-miles/qtr (regional market)
  cumulativeProfit: 0,
};
