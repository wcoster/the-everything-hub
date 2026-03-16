export type TimelineEventType = 'deposito' | 'stock_lump' | 'extra_repayment';

export interface TimelineEvent {
  id: string;
  year: number;              // 1-indexed year when event fires (year 1 = first year)
  type: TimelineEventType;
  amount: number;
  label?: string;
  depositoDuration?: number; // years (for deposito type)
  depositoRate?: number;     // % annual (for deposito type)
}

export interface PlannerInputs {
  years: number;
  freeIncome: number;
  raiseRate: number;
  revInit: number;
  revMo: number;
  revRate1: number;
  revTier: number;
  revRate2: number;
  extInit: number;
  extMo: number;
  extRate: number;
  debtInit: number;
  debtMo: number;
  debtRate: number;
  // Stocks
  stockInit: number;
  stockMo: number;
  stockRate: number;
  // Buffer
  bufferAmount: number;
  // Timeline events
  events: TimelineEvent[];
}

export interface SimResult {
  wealthHist:   number[];
  debtHist:     number[];
  assetHist:    number[];
  stockHist:    number[];
  depositoHist: number[];
  debtFreeMonth: number | null;
  finalDebt:    number;
}

export interface OptimizePayload {
  revStart:    number;
  extStart:    number;
  debtStart:   number;
  stockStart:  number;
  rR1:         number;
  rR2:         number;
  revTier:     number;
  eR:          number;
  dR:          number;
  sR:          number;
  totalBudget: number;
  simMonths:   number;
  raiseRate:   number;
  curRevMo:    number;
  curExtMo:    number;
  curDebtMo:   number;
  curStockMo:  number;
}

export interface OptimizeResult {
  bestRev:       number;
  bestExt:       number;
  bestDebt:      number;
  bestStock:     number;
  bestWealth:    number;
  currentWealth: number;
}

export type DebtFreeResult =
  | { key: 'wealthPlanner.debtStatus.none' }
  | { key: 'wealthPlanner.debtStatus.tooLow' }
  | { key: 'wealthPlanner.debtStatus.yearsMonths'; years: number; months: number }
  | { key: 'wealthPlanner.debtStatus.years';       years: number }
  | { key: 'wealthPlanner.debtStatus.months';      months: number };
