import { useMemo, useRef, useCallback } from 'react';
import {
  Chart as ChartJS, CategoryScale, LinearScale,
  PointElement, LineElement, Tooltip, Legend, Filler, ArcElement,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler, ArcElement);
import { useTranslation } from 'react-i18next';
import type { PlannerInputs, OptimizeResult } from '../../types';
import { runSimulation, getDebtFreeResult, monthlyRate } from '../../utils/simulation';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import ModuleLayout      from '../../components/ModuleLayout/ModuleLayout';
import IncomeBar         from '../../components/IncomeBar/IncomeBar';
import StatGrid          from '../../components/StatGrid/StatGrid';
import InputGrid         from '../../components/InputGrid/InputGrid';
import AllocationSection from '../../components/AllocationSection/AllocationSection';
import StrategyChart     from '../../components/StrategyChart/StrategyChart';
import OptimizeSection   from '../../components/OptimizeSection/OptimizeSection';
import TimelineEditor    from '../../components/TimelineEditor/TimelineEditor';
import styles from './WealthPlanner.module.css';

const DEFAULT_INPUTS: PlannerInputs = {
  years:        5,
  freeIncome:   1200,
  raiseRate:    2,
  revInit:      8000,
  revMo:        200,
  revRate1:     2.0,
  revTier:      2000,
  revRate2:     1.0,
  extInit:      5000,
  extMo:        400,
  extRate:      2.0,
  debtInit:     30000,
  debtMo:       300,
  debtRate:     2.57,
  stockInit:    0,
  stockMo:      0,
  stockRate:    7.0,
  bufferAmount: 2000,
  events:       [],
};

export default function WealthPlanner() {
  const { t } = useTranslation();
  const [inputs, setInputs] = useLocalStorage<PlannerInputs>('module:vermogenplanner', DEFAULT_INPUTS);
  const animRef = useRef<number | null>(null);

  // Ensure events array exists (backwards compat with saved state before this field existed)
  const safeInputs = useMemo(() => ({
    ...DEFAULT_INPUTS,
    ...inputs,
    events: inputs.events ?? [],
  }), [inputs]);

  function update<K extends keyof PlannerInputs>(key: K, value: PlannerInputs[K]) {
    setInputs(prev => ({ ...prev, [key]: value }));
  }

  const simResult      = useMemo(() => runSimulation(safeInputs), [safeInputs]);
  const debtFreeResult = useMemo(() => getDebtFreeResult(simResult, safeInputs), [simResult, safeInputs]);
  const debtFreeText   = t(debtFreeResult.key, debtFreeResult as Record<string, unknown>);

  const endIncome = useMemo(() => {
    const factor = Math.pow(1 + safeInputs.raiseRate / 100, safeInputs.years);
    return Math.round(safeInputs.freeIncome * factor);
  }, [safeInputs.freeIncome, safeInputs.raiseRate, safeInputs.years]);

  const handleApplyBest = useCallback((best: OptimizeResult) => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    const startRev   = safeInputs.revMo;
    const startExt   = safeInputs.extMo;
    const startDebt  = safeInputs.debtMo;
    const startStock = safeInputs.stockMo;
    const t0  = performance.now();
    const dur = 600;

    function step(now: number) {
      const elapsed = Math.min((now - t0) / dur, 1);
      const ease    = 1 - Math.pow(1 - elapsed, 3);
      setInputs(prev => ({
        ...prev,
        revMo:   Math.round(startRev   + (best.bestRev   - startRev)   * ease),
        extMo:   Math.round(startExt   + (best.bestExt   - startExt)   * ease),
        debtMo:  Math.round(startDebt  + (best.bestDebt  - startDebt)  * ease),
        stockMo: Math.round(startStock + (best.bestStock - startStock) * ease),
      }));
      if (elapsed < 1) animRef.current = requestAnimationFrame(step);
    }

    animRef.current = requestAnimationFrame(step);
  }, [safeInputs.revMo, safeInputs.extMo, safeInputs.debtMo, safeInputs.stockMo]);

  const optimizePayload = useMemo(() => ({
    revStart:    safeInputs.revInit,
    extStart:    safeInputs.extInit,
    debtStart:   safeInputs.debtInit,
    stockStart:  safeInputs.stockInit,
    rR1:         monthlyRate(safeInputs.revRate1),
    rR2:         monthlyRate(safeInputs.revRate2),
    revTier:     safeInputs.revTier,
    eR:          monthlyRate(safeInputs.extRate),
    dR:          monthlyRate(safeInputs.debtRate),
    sR:          monthlyRate(safeInputs.stockRate),
    totalBudget: safeInputs.freeIncome,
    simMonths:   safeInputs.years * 12,
    raiseRate:   safeInputs.raiseRate,
    curRevMo:    safeInputs.revMo,
    curExtMo:    safeInputs.extMo,
    curDebtMo:   safeInputs.debtMo,
    curStockMo:  safeInputs.stockMo,
  }), [safeInputs]);

  const totalMonths = safeInputs.years * 12;

  return (
    <ModuleLayout>
      <div className={styles.header}>
        <div className={styles.headerIcon}>🏑</div>
        <div className={styles.headerText}>
          <h1>{t('wealthPlanner.title')}</h1>
          <p>{t('wealthPlanner.subtitle', { years: safeInputs.years })}</p>
        </div>
        <div className={styles.yearWrap}>
          <select value={safeInputs.years} onChange={e => update('years', parseInt(e.target.value))}>
            {[1, 2, 3, 5, 7, 10, 15, 20, 30].map(y => (
              <option key={y} value={y}>{t('wealthPlanner.yearOption', { n: y })}</option>
            ))}
          </select>
        </div>
      </div>

      <IncomeBar
        freeIncome={safeInputs.freeIncome}
        raiseRate={safeInputs.raiseRate}
        revMo={safeInputs.revMo}
        extMo={safeInputs.extMo}
        debtMo={safeInputs.debtMo}
        stockMo={safeInputs.stockMo}
        onFreeIncomeChange={v => update('freeIncome', v)}
        onRaiseRateChange={v  => update('raiseRate',  v)}
      />

      <StatGrid
        wealth={simResult.wealthHist[totalMonths]}
        debtFreeText={debtFreeText}
        assets={simResult.assetHist[totalMonths]}
        stocks={simResult.stockHist[totalMonths]}
        endIncome={endIncome}
        years={safeInputs.years}
      />

      <AllocationSection
        freeIncome={safeInputs.freeIncome}
        revMo={safeInputs.revMo}
        extMo={safeInputs.extMo}
        debtMo={safeInputs.debtMo}
        stockMo={safeInputs.stockMo}
      />

      <InputGrid inputs={safeInputs} onChange={update} />

      <TimelineEditor
        events={safeInputs.events}
        maxYear={safeInputs.years}
        onChange={evts => update('events', evts)}
      />

      <OptimizeSection
        payload={optimizePayload}
        currentRevMo={safeInputs.revMo}
        currentExtMo={safeInputs.extMo}
        currentDebtMo={safeInputs.debtMo}
        currentStockMo={safeInputs.stockMo}
        years={safeInputs.years}
        onApplyBest={handleApplyBest}
      />

      <StrategyChart simResult={simResult} years={safeInputs.years} bufferAmount={safeInputs.bufferAmount} />

      <footer className={styles.footer}>{t('wealthPlanner.footer')}</footer>
    </ModuleLayout>
  );
}
