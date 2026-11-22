import { ISO_KNOWLEDGE_BASE, ISO_STANDARD_LIST } from '../../data/isoKnowledgeBase';
import type {
  ComplianceStatus,
  ControlHierarchyLevel,
  CriticalityLevel,
  EnergySeuRecord,
  GapEvaluation,
  ImsCapaItem,
  ImsProjectState,
  IsoStandardCode,
} from './types';

export const STATUS_WEIGHTS: Record<Exclude<ComplianceStatus, 'na'>, number> = {
  compliant: 100,
  in_progress: 50,
  minor_nc: 25,
  major_nc: 0,
};

export interface StandardReadinessSummary {
  standard: IsoStandardCode;
  readinessPct: number;
  evaluatedCount: number;
  compliantCount: number;
  inProgressCount: number;
  minorNcCount: number;
  majorNcCount: number;
  naCount: number;
}

export interface OverallReadinessSummary {
  overallPct: number;
  byStandard: Record<IsoStandardCode, StandardReadinessSummary>;
  totalMinorNc: number;
  totalMajorNc: number;
  totalCompliant: number;
  totalApplicable: number;
}

export function makeEvaluationKey(clauseNumber: string, standard: IsoStandardCode): string {
  return `${clauseNumber}::${standard}`;
}

/**
 * Computes live readiness percentages per ISO standard and overall IMS score.
 * Clauses marked N/A are excluded from the denominator.
 */
export function computeImsReadiness(
  evaluations: Record<string, GapEvaluation>
): OverallReadinessSummary {
  const byStandard = {} as Record<IsoStandardCode, StandardReadinessSummary>;

  let totalScoreSum = 0;
  let totalApplicable = 0;
  let totalMinorNc = 0;
  let totalMajorNc = 0;
  let totalCompliant = 0;

  for (const std of ISO_STANDARD_LIST) {
    let scoreSum = 0;
    let applicable = 0;
    let compliantCount = 0;
    let inProgressCount = 0;
    let minorNcCount = 0;
    let majorNcCount = 0;
    let naCount = 0;

    for (const clause of ISO_KNOWLEDGE_BASE) {
      const key = makeEvaluationKey(clause.clauseNumber, std);
      const status: ComplianceStatus = evaluations[key]?.status ?? 'in_progress';
      if (status === 'na') {
        naCount += 1;
        continue;
      }
      applicable += 1;
      scoreSum += STATUS_WEIGHTS[status];
      if (status === 'compliant') compliantCount += 1;
      else if (status === 'in_progress') inProgressCount += 1;
      else if (status === 'minor_nc') minorNcCount += 1;
      else if (status === 'major_nc') majorNcCount += 1;
    }

    const readinessPct = applicable > 0 ? Math.round(scoreSum / applicable) : 100;
    byStandard[std] = {
      standard: std,
      readinessPct,
      evaluatedCount: applicable,
      compliantCount,
      inProgressCount,
      minorNcCount,
      majorNcCount,
      naCount,
    };

    totalScoreSum += scoreSum;
    totalApplicable += applicable;
    totalMinorNc += minorNcCount;
    totalMajorNc += majorNcCount;
    totalCompliant += compliantCount;
  }

  const overallPct =
    totalApplicable > 0 ? Math.round(totalScoreSum / totalApplicable) : 100;

  return {
    overallPct,
    byStandard,
    totalMinorNc,
    totalMajorNc,
    totalCompliant,
    totalApplicable,
  };
}

/**
 * Synchronizes auto-generated CAPA items whenever a Gap Analysis clause is marked Minor NC or Major NC.
 * Preserves existing manual edits (owner, rootCause, deadline, status) on already generated CAPAs.
 */
export function syncAutoCapaForEvaluation(
  existingCapas: ImsCapaItem[],
  evaluation: GapEvaluation,
  nowIso: string = new Date().toISOString()
): ImsCapaItem[] {
  const isNc = evaluation.status === 'minor_nc' || evaluation.status === 'major_nc';
  const existingIdx = existingCapas.findIndex(
    (item) => item.sourceEvaluationKey === evaluation.key
  );

  if (!isNc) {
    // If clause was resolved to Compliant/N/A, automatically mark linked open CAPA as verified instead of deleting audit trail
    if (existingIdx !== -1 && evaluation.status === 'compliant') {
      const copy = [...existingCapas];
      copy[existingIdx] = {
        ...copy[existingIdx],
        status: 'verified',
      };
      return copy;
    }
    return existingCapas;
  }

  const clauseObj = ISO_KNOWLEDGE_BASE.find(
    (c) => c.clauseNumber === evaluation.clauseNumber
  );
  const stdDetail = clauseObj?.standards[evaluation.standard];
  const severity: 'minor_nc' | 'major_nc' =
    evaluation.status === 'major_nc' ? 'major_nc' : 'minor_nc';

  if (existingIdx !== -1) {
    const copy = [...existingCapas];
    copy[existingIdx] = {
      ...copy[existingIdx],
      severity,
      status: copy[existingIdx].status === 'verified' ? 'open' : copy[existingIdx].status,
    };
    return copy;
  }

  const defaultDeadlineDays = severity === 'major_nc' ? 14 : 30;
  const deadlineDate = new Date(
    new Date(nowIso).getTime() + defaultDeadlineDays * 86400000
  )
    .toISOString()
    .slice(0, 10);

  const newCapa: ImsCapaItem = {
    id: `capa-auto-${evaluation.standard}-${evaluation.clauseNumber.replace('.', '-')}`,
    sourceEvaluationKey: evaluation.key,
    clauseNumber: evaluation.clauseNumber,
    standard: evaluation.standard,
    severity,
    title: `رفع عدم انطباق بند ${evaluation.clauseNumber} (ISO ${evaluation.standard}) — ${stdDetail?.focusTitle ?? clauseObj?.title ?? ''}`,
    rootCause: evaluation.notes.trim()
      ? evaluation.notes.trim()
      : 'نیاز به تحلیل علت ریشه‌ای (RCA) و تکمیل شواهد انطباق بند استاندارد.',
    correctiveAction: stdDetail?.documentHint
      ? `تدوین/به‌روزرسانی «${stdDetail.documentHint}» و استقرار کنترل‌های عملیاتی مرتبط.`
      : 'تدوین برنامه اصلاحی، آموزش مسئولین و ثبت شواهد عینی انطباق.',
    owner:
      evaluation.standard === '14001'
        ? 'سرپرست محیط زیست'
        : evaluation.standard === '45001'
          ? 'سرپرست ایمنی (HSE)'
          : evaluation.standard === '50001'
            ? 'تیم مدیریت انرژی'
            : 'مدیریت دارایی و نت',
    deadline: deadlineDate,
    status: 'open',
    createdAt: nowIso.slice(0, 10),
  };

  return [newCapa, ...existingCapas];
}

// =========================================================================
// 1. ISO 14001 — Aspects & Impacts Scoring Engine
// =========================================================================
export const ASPECT_SIGNIFICANCE_THRESHOLD = 24;

export interface AspectScoreResult {
  score: number; // Max 5 * 5 * 3 = 75
  isSignificant: boolean;
  band: 'significant' | 'moderate' | 'low';
  bandLabel: string;
}

export function calculateAspectSignificance(
  severity: number,
  probability: number,
  legalFactor: number
): AspectScoreResult {
  const s = Math.max(1, Math.min(5, Math.round(severity)));
  const p = Math.max(1, Math.min(5, Math.round(probability)));
  const l = Math.max(1, Math.min(3, Math.round(legalFactor)));
  const score = s * p * l;
  // Automatic significant flag if score >= 24 OR severity === 5 with legalFactor >= 2
  const isSignificant = score >= ASPECT_SIGNIFICANCE_THRESHOLD || (s === 5 && l >= 2);
  if (isSignificant) {
    return {
      score,
      isSignificant: true,
      band: 'significant',
      bandLabel: 'جنبه بارز (Significant)',
    };
  }
  if (score >= 12) {
    return {
      score,
      isSignificant: false,
      band: 'moderate',
      bandLabel: 'تحت پایش (Moderate)',
    };
  }
  return {
    score,
    isSignificant: false,
    band: 'low',
    bandLabel: 'قابل قبول (Low)',
  };
}

// =========================================================================
// 2. ISO 45001 — HIRA Risk Matrix & 5-Level Hierarchy of Controls
// =========================================================================
export const CONTROL_HIERARCHY_META: Record<
  ControlHierarchyLevel,
  { rank: number; label: string; english: string; reductionFactor: number }
> = {
  elimination: {
    rank: 1,
    label: 'حذف خطر',
    english: 'Elimination',
    reductionFactor: 0.78,
  },
  substitution: {
    rank: 2,
    label: 'جایگزینی',
    english: 'Substitution',
    reductionFactor: 0.58,
  },
  engineering: {
    rank: 3,
    label: 'کنترل مهندسی',
    english: 'Engineering Controls',
    reductionFactor: 0.42,
  },
  administrative: {
    rank: 4,
    label: 'کنترل اداری و آموزشی',
    english: 'Administrative Controls',
    reductionFactor: 0.24,
  },
  ppe: {
    rank: 5,
    label: 'تجهیزات حفاظت فردی (PPE)',
    english: 'PPE',
    reductionFactor: 0.14,
  },
};

export interface HiraRiskEvaluation {
  initialScore: number; // 1..25
  residualScore: number; // 1..25
  reductionPct: number;
  initialBand: CriticalityLevel;
  residualBand: CriticalityLevel;
  initialLabel: string;
  residualLabel: string;
}

export function classifyRiskScore(score: number): {
  band: CriticalityLevel;
  label: string;
} {
  if (score >= 16) return { band: 'critical', label: 'بحرانی (غیرقابل قبول)' };
  if (score >= 10) return { band: 'high', label: 'بالا (نیاز به اقدام فوری)' };
  if (score >= 5) return { band: 'medium', label: 'متوسط (قابل کنترل)' };
  return { band: 'low', label: 'پایین (قابل قبول)' };
}

export function calculateHiraRisk(
  initialSeverity: number,
  initialLikelihood: number,
  controlsApplied: ControlHierarchyLevel[]
): HiraRiskEvaluation {
  const s = Math.max(1, Math.min(5, Math.round(initialSeverity)));
  const l = Math.max(1, Math.min(5, Math.round(initialLikelihood)));
  const initialScore = s * l;

  // Compound multiplicative reduction from applied Hierarchy of Controls layers
  const uniqueControls = Array.from(new Set(controlsApplied));
  let remainingFraction = 1;
  for (const level of uniqueControls) {
    const meta = CONTROL_HIERARCHY_META[level];
    if (meta) {
      remainingFraction *= 1 - meta.reductionFactor;
    }
  }

  const residualScore = Math.max(1, Math.round(initialScore * remainingFraction));
  const reductionPct =
    initialScore > 0
      ? Math.max(0, Math.round(((initialScore - residualScore) / initialScore) * 100))
      : 0;

  const initClass = classifyRiskScore(initialScore);
  const resClass = classifyRiskScore(residualScore);

  return {
    initialScore,
    residualScore,
    reductionPct,
    initialBand: initClass.band,
    residualBand: resClass.band,
    initialLabel: initClass.label,
    residualLabel: resClass.label,
  };
}

// =========================================================================
// 3. ISO 50001 — Energy Review, SEU Share & EnPI Calculator
// =========================================================================
export interface EnergyMetricsResult {
  baselineEnpi: number;
  actualEnpi: number;
  variancePct: number; // negative means energy savings (improvement!)
  savedEnergy: number; // positive means saved vs baseline
  improved: boolean;
}

export function calculateEnergyMetrics(record: EnergySeuRecord): EnergyMetricsResult {
  const safeOutput = Math.max(1, record.outputVolume);
  const baselineEnpi = Number((record.enbBaseline / safeOutput).toFixed(2));
  const actualEnpi = Number((record.actualEnergy / safeOutput).toFixed(2));
  const savedEnergy = Number((record.enbBaseline - record.actualEnergy).toFixed(1));
  const variancePct =
    record.enbBaseline > 0
      ? Number(
          (((record.actualEnergy - record.enbBaseline) / record.enbBaseline) * 100).toFixed(1)
        )
      : 0;

  return {
    baselineEnpi,
    actualEnpi,
    variancePct,
    savedEnergy,
    improved: record.actualEnergy <= record.enbBaseline,
  };
}

export function computeSeuCoverageSummary(consumers: EnergySeuRecord[]): {
  totalBaseline: number;
  totalActual: number;
  seuActual: number;
  seuSharePct: number;
  overallChangePct: number;
} {
  let totalBaseline = 0;
  let totalActual = 0;
  let seuActual = 0;

  for (const c of consumers) {
    totalBaseline += c.enbBaseline;
    totalActual += c.actualEnergy;
    if (c.isSeu) seuActual += c.actualEnergy;
  }

  const seuSharePct =
    totalActual > 0 ? Math.round((seuActual / totalActual) * 100) : 0;
  const overallChangePct =
    totalBaseline > 0
      ? Number((((totalActual - totalBaseline) / totalBaseline) * 100).toFixed(1))
      : 0;

  return {
    totalBaseline: Number(totalBaseline.toFixed(1)),
    totalActual: Number(totalActual.toFixed(1)),
    seuActual: Number(seuActual.toFixed(1)),
    seuSharePct,
    overallChangePct,
  };
}

// =========================================================================
// 4. ISO 55001 — Asset Criticality Matrix (5x5 Heatmap)
// =========================================================================
export interface AssetCriticalityResult {
  score: number; // 1..25
  level: CriticalityLevel;
  label: string;
  recommendedStrategy: string;
}

export function calculateAssetCriticality(
  consequence: number,
  likelihood: number
): AssetCriticalityResult {
  const c = Math.max(1, Math.min(5, Math.round(consequence)));
  const l = Math.max(1, Math.min(5, Math.round(likelihood)));
  const score = c * l;

  if (score >= 16) {
    return {
      score,
      level: 'critical',
      label: 'بحرانی (Tier 1)',
      recommendedStrategy: 'نگهداری پیش‌گویانه آنلاین (PdM / CBM) + قطعه یدکی حیاتی + RCM',
    };
  }
  if (score >= 10) {
    return {
      score,
      level: 'high',
      label: 'بالا (Tier 2)',
      recommendedStrategy: 'نگهداری مبتنی بر قابلیت اطمینان (RCM) و پایش وضعیت دوره‌ای',
    };
  }
  if (score >= 5) {
    return {
      score,
      level: 'medium',
      label: 'متوسط (Tier 3)',
      recommendedStrategy: 'نگهداری پیشگیرانه زمان‌بندی‌شده (PM)',
    };
  }
  return {
    score,
    level: 'low',
    label: 'پایین (Tier 4)',
    recommendedStrategy: 'نگهداری اصلاحی کنترل‌شده (Run-to-Failure / CM)',
  };
}

// =========================================================================
// 5. Client-Side CSV Serialization & JSON Project Validation
// =========================================================================
export function escapeCsvCell(value: string | number | boolean | undefined | null): string {
  const raw = value === undefined || value === null ? '' : String(value);
  if (/[",\r\n]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function buildUtf8Csv(headers: string[], rows: Array<Array<string | number | boolean>>): string {
  const bom = '\uFEFF'; // Ensures Persian text renders cleanly in Microsoft Excel
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map((row) => row.map(escapeCsvCell).join(',')),
  ];
  return bom + lines.join('\r\n');
}

export function validateImportedProjectJson(rawText: string): {
  ok: true;
  data: ImsProjectState;
} | {
  ok: false;
  error: string;
} {
  try {
    const parsed = JSON.parse(rawText) as Partial<ImsProjectState>;
    if (!parsed || typeof parsed !== 'object') {
      return { ok: false, error: 'ساختار فایل JSON معتبر نیست.' };
    }
    if (
      typeof parsed.evaluations !== 'object' ||
      !Array.isArray(parsed.capas) ||
      !Array.isArray(parsed.assets) ||
      !Array.isArray(parsed.documents)
    ) {
      return {
        ok: false,
        error: 'فایل انتخاب‌شده شامل ساختار کامل پروژه IMS (evaluations, capas, assets, documents) نیست.',
      };
    }
    return { ok: true, data: parsed as ImsProjectState };
  } catch {
    return { ok: false, error: 'خطا در خواندن فایل JSON. لطفاً یک فایل پشتیبان معتبر انتخاب کنید.' };
  }
}
