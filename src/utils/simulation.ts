import type { PlannerInputs, SimResult, DebtFreeResult, TimelineEvent } from '../types';

export function monthlyRate(annualPct: number): number {
  return Math.pow(1 + annualPct / 100, 1 / 12) - 1;
}

interface ActiveDeposito {
  id: string;
  maturityMonth: number;
  balance: number;
  monthlyRate: number;
}

export function runSimulation(inputs: PlannerInputs): SimResult {
  const {
    years, revInit, extInit, debtInit, stockInit,
    revMo: revMoBase, extMo, debtMo, stockMo, raiseRate,
    revRate1, revRate2, revTier, extRate, debtRate, stockRate,
    events,
  } = inputs;

  const totalMonths = years * 12;
  const rR1 = monthlyRate(revRate1);
  const rR2 = monthlyRate(revRate2);
  const eR  = monthlyRate(extRate);
  const dR  = monthlyRate(debtRate);
  const sR  = monthlyRate(stockRate);

  let rev   = revInit;
  let ext   = extInit;
  let debt  = debtInit;
  let stock = stockInit;

  const activeDepositos: ActiveDeposito[] = [];

  const wealthHist:   number[] = [];
  const debtHist:     number[] = [];
  const assetHist:    number[] = [];
  const stockHist:    number[] = [];
  const depositoHist: number[] = [];
  let debtFreeMonth: number | null = debt <= 0 ? 0 : null;

  // Pre-group events by the month they fire (year 1 = month 0, year 2 = month 12, ...)
  const eventsByMonth = new Map<number, TimelineEvent[]>();
  for (const ev of events) {
    const m = (ev.year - 1) * 12;
    const arr = eventsByMonth.get(m) ?? [];
    arr.push(ev);
    eventsByMonth.set(m, arr);
  }

  for (let m = 0; m <= totalMonths; m++) {
    const totalDep = activeDepositos.reduce((s, d) => s + d.balance, 0);
    wealthHist.push(Math.round(rev + ext + stock + totalDep - debt));
    debtHist.push(Math.round(debt));
    assetHist.push(Math.round(rev + ext + stock + totalDep));
    stockHist.push(Math.round(stock));
    depositoHist.push(Math.round(totalDep));

    if (m < totalMonths) {
      const yearIndex      = Math.floor(m / 12);
      const raiseFactor    = Math.pow(1 + raiseRate / 100, yearIndex);
      const curRevMoScaled   = revMoBase * raiseFactor;
      const curExtMoScaled   = extMo     * raiseFactor;
      const curDebtMoScaled  = debtMo    * raiseFactor;
      const curStockMoScaled = stockMo   * raiseFactor;

      let currentRevMo = curRevMoScaled;

      // Apply interest
      const tierPart = Math.min(rev, revTier);
      const overPart = Math.max(rev - revTier, 0);
      rev   += tierPart * rR1 + overPart * rR2;
      ext   += ext   * eR;
      stock += stock * sR;

      // Apply interest to depositos and check maturities
      for (const dep of activeDepositos) dep.balance *= (1 + dep.monthlyRate);
      for (let i = activeDepositos.length - 1; i >= 0; i--) {
        if (m + 1 >= activeDepositos[i].maturityMonth) {
          rev += activeDepositos[i].balance;
          activeDepositos.splice(i, 1);
        }
      }

      // Debt repayment
      if (debt > 0) {
        debt = debt * (1 + dR) - curDebtMoScaled;
        if (debt <= 0) {
          debt = 0;
          if (debtFreeMonth === null) debtFreeMonth = m + 1;
        }
      } else {
        currentRevMo += curDebtMoScaled;
      }

      // Monthly contributions
      rev   += currentRevMo;
      ext   += curExtMoScaled;
      stock += curStockMoScaled;

      // Process timeline events that fire at the START of the NEXT month (= m+1)
      // Events are indexed by their fire month: (year-1)*12
      const eventsNow = eventsByMonth.get(m + 1) ?? [];
      for (const ev of eventsNow) {
        if (ev.type === 'deposito' && ev.depositoDuration && ev.depositoRate !== undefined) {
          const transfer = Math.min(ev.amount, Math.max(rev, 0));
          rev -= transfer;
          activeDepositos.push({
            id: ev.id,
            maturityMonth: m + 1 + ev.depositoDuration * 12,
            balance: transfer,
            monthlyRate: monthlyRate(ev.depositoRate),
          });
        } else if (ev.type === 'stock_lump') {
          const transfer = Math.min(ev.amount, Math.max(rev, 0));
          rev   -= transfer;
          stock += transfer;
        } else if (ev.type === 'extra_repayment' && debt > 0) {
          const pay = Math.min(ev.amount, debt, Math.max(rev, 0));
          rev  -= pay;
          debt -= pay;
          if (debt <= 0 && debtFreeMonth === null) {
            debt = 0;
            debtFreeMonth = m + 1;
          }
        }
      }
    }
  }

  return { wealthHist, debtHist, assetHist, stockHist, depositoHist, debtFreeMonth, finalDebt: debt };
}

export function getDebtFreeResult(simResult: SimResult, inputs: PlannerInputs): DebtFreeResult {
  let { debtFreeMonth } = simResult;

  if (debtFreeMonth === 0) return { key: 'wealthPlanner.debtStatus.none' };

  function monthsToResult(total: number): DebtFreeResult {
    const y = Math.floor(total / 12);
    const mo = total % 12;
    if (y > 0 && mo > 0) return { key: 'wealthPlanner.debtStatus.yearsMonths', years: y, months: mo };
    if (y > 0)           return { key: 'wealthPlanner.debtStatus.years',        years: y };
    return                      { key: 'wealthPlanner.debtStatus.months',        months: mo };
  }

  if (debtFreeMonth !== null) return monthsToResult(debtFreeMonth);

  const { years, debtMo, debtRate, raiseRate } = inputs;
  const dR = monthlyRate(debtRate);
  let simDebt    = simResult.finalDebt;
  let extraMonth = years * 12;
  const maxSim   = 600;

  while (simDebt > 0 && extraMonth < maxSim) {
    const rf = Math.pow(1 + raiseRate / 100, Math.floor(extraMonth / 12));
    simDebt = simDebt * (1 + dR) - debtMo * rf;
    extraMonth++;
    if (simDebt <= 0) { debtFreeMonth = extraMonth; break; }
  }

  if (debtFreeMonth !== null) return monthsToResult(debtFreeMonth);
  return { key: 'wealthPlanner.debtStatus.tooLow' };
}

// Simplified simulation for the optimizer (no events, no depositos)
export function simulate(
  revStart: number, extStart: number, debtStart: number, stockStart: number,
  revMo: number,    extMo: number,    debtMo: number,   stockMo: number,
  rR1: number, rR2: number, revTier: number,
  eR: number,  dR: number,  sR: number,
  months: number, raiseRate: number,
): number {
  let rev = revStart, ext = extStart, debt = debtStart, stock = stockStart;
  const rr = raiseRate / 100;

  for (let m = 0; m < months; m++) {
    const rf     = Math.pow(1 + rr, Math.floor(m / 12));
    const sRevMo   = revMo   * rf;
    const sExtMo   = extMo   * rf;
    const sDebtMo  = debtMo  * rf;
    const sStockMo = stockMo * rf;
    let curRevMo   = sRevMo;

    const tp = Math.min(rev, revTier);
    const op = Math.max(rev - revTier, 0);
    rev   += tp * rR1 + op * rR2;
    ext   += ext   * eR;
    stock += stock * sR;

    if (debt > 0) {
      debt = debt * (1 + dR) - sDebtMo;
      if (debt <= 0) debt = 0;
    } else {
      curRevMo += sDebtMo;
    }

    rev   += curRevMo;
    ext   += sExtMo;
    stock += sStockMo;
  }

  return Math.round(rev + ext + stock - debt);
}
