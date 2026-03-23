// Per-firm economics
export const MARGINAL_COST = 5;
export const FIXED_COST = 15000;
export const MIN_PRICE = 8;
export const MAX_PRICE = 30;
export const DEFAULT_PRICE = 18;
export const DEFAULT_QUALITY = 50;
export const DEFAULT_BRAND = 0.5;
export const MAX_QUALITY_INVESTMENT = 10000;
export const MAX_MARKETING_SPEND = 10000;

// Market
export const BASE_MARKET_SIZE = 10000;
export const MARKET_GROWTH_RATE = 0.02;
export const BANKRUPTCY_THRESHOLD = -100000;

// Demand model (logit)
export const ALPHA = 0.03;   // quality sensitivity
export const BETA = 2.0;     // brand sensitivity
export const GAMMA = 0.15;   // price sensitivity
export const NOISE_RANGE = 0.1;

// Quality dynamics
export const QUALITY_DECAY = 0.97;
export const QUALITY_INVEST_FACTOR = 0.005;
export const MAX_QUALITY = 100;

// Brand dynamics
export const BRAND_DECAY = 0.95;
export const MARKETING_FACTOR = 0.00005;
export const WORD_OF_MOUTH_FACTOR = 0.02;
export const MAX_BRAND = 1;
