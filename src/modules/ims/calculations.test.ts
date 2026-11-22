import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildUtf8Csv,
  calculateAspectSignificance,
  calculateAssetCriticality,
  calculateEnergyMetrics,
  calculateHiraRisk,
  computeImsReadiness,
  computeSeuCoverageSummary,
  makeEvaluationKey,
  syncAutoCapaForEvaluation,
  validateImportedProjectJson,
} from './calculations';
import { ISO_KNOWLEDGE_BASE } from '../../data/isoKnowledgeBase';
import type { GapEvaluation, ImsCapaItem } from './types';

test('ISO knowledge base covers Clauses 4 through 10 across all four standards', () => {
  const parents = new Set(ISO_KNOWLEDGE_BASE.map((c) => c.parentClause));
  for (const ch of [4, 5, 6, 7, 8, 9, 10]) {
    assert.ok(parents.has(ch), `Missing Annex SL parent clause ${ch}`);
  }
  for (const clause of ISO_KNOWLEDGE_BASE) {
    for (const std of ['14001', '45001', '50001', '55001'] as const) {
      const detail = clause.standards[std];
      assert.ok(detail.focusTitle.length > 3);
      assert.ok(detail.auditQuestions.length >= 2);
    }
  }
});

test('computeImsReadiness computes exact weighted scores and excludes N/A clauses', () => {
  const evals: Record<string, GapEvaluation> = {};
  for (const c of ISO_KNOWLEDGE_BASE) {
    const k14 = makeEvaluationKey(c.clauseNumber, '14001');
    evals[k14] = {
      key: k14,
      clauseNumber: c.clauseNumber,
      standard: '14001',
      status: c.clauseNumber === '4.1' ? 'na' : 'compliant',
      notes: '',
      evidenceLink: '',
      updatedAt: '2026-11-22',
    };
    const k45 = makeEvaluationKey(c.clauseNumber, '45001');
    evals[k45] = {
      key: k45,
      clauseNumber: c.clauseNumber,
      standard: '45001',
      status: 'major_nc',
      notes: '',
      evidenceLink: '',
      updatedAt: '2026-11-22',
    };
  }

  const summary = computeImsReadiness(evals);
  assert.equal(summary.byStandard['14001'].readinessPct, 100);
  assert.equal(summary.byStandard['14001'].naCount, 1);
  assert.equal(summary.byStandard['45001'].readinessPct, 0);
  assert.equal(summary.byStandard['45001'].majorNcCount, ISO_KNOWLEDGE_BASE.length);
  assert.equal(summary.byStandard['50001'].readinessPct, 50); // defaults to in_progress (50)
});

test('syncAutoCapaForEvaluation creates CAPA on Minor/Major NC and verifies on Compliant', () => {
  const key = makeEvaluationKey('6.1', '14001');
  const majorEval: GapEvaluation = {
    key,
    clauseNumber: '6.1',
    standard: '14001',
    status: 'major_nc',
    notes: 'ماتریس جنبه‌های زیست‌محیطی به‌روز نشده است',
    evidenceLink: '',
    updatedAt: '2026-11-22',
  };

  let capas: ImsCapaItem[] = [];
  capas = syncAutoCapaForEvaluation(capas, majorEval, '2026-11-22T00:00:00Z');
  assert.equal(capas.length, 1);
  assert.equal(capas[0].severity, 'major_nc');
  assert.equal(capas[0].status, 'open');
  assert.ok(capas[0].rootCause.includes('ماتریس جنبه‌ها'));

  // Updating evaluation to compliant verifies the auto-generated CAPA
  const compliantEval: GapEvaluation = { ...majorEval, status: 'compliant' };
  capas = syncAutoCapaForEvaluation(capas, compliantEval, '2026-11-22T00:00:00Z');
  assert.equal(capas.length, 1);
  assert.equal(capas[0].status, 'verified');
});

test('ISO 14001 aspect significance flags Significant Aspects correctly', () => {
  const sig = calculateAspectSignificance(4, 3, 2); // 24
  assert.equal(sig.score, 24);
  assert.equal(sig.isSignificant, true);

  const severeLegal = calculateAspectSignificance(5, 1, 2); // 10, but S=5 & L>=2
  assert.equal(severeLegal.isSignificant, true);

  const low = calculateAspectSignificance(2, 2, 1); // 4
  assert.equal(low.isSignificant, false);
  assert.equal(low.band, 'low');
});

test('ISO 45001 HIRA drops residual risk according to Hierarchy of Controls', () => {
  const noControls = calculateHiraRisk(5, 4, []);
  assert.equal(noControls.initialScore, 20);
  assert.equal(noControls.residualScore, 20);
  assert.equal(noControls.initialBand, 'critical');

  const engAndPpe = calculateHiraRisk(5, 4, ['engineering', 'administrative', 'ppe']);
  assert.ok(engAndPpe.residualScore < noControls.initialScore);
  assert.ok(engAndPpe.reductionPct >= 55);

  const eliminated = calculateHiraRisk(5, 4, ['elimination']);
  assert.ok(eliminated.residualScore <= 5);
});

test('ISO 50001 EnPI and SEU coverage summary compute accurate savings', () => {
  const metrics = calculateEnergyMetrics({
    id: 'e1',
    consumerName: 'کمپرسور هوا',
    unit: 'یوتیلیتی',
    carrier: 'برق (Electricity)',
    isSeu: true,
    enbBaseline: 1000,
    actualEnergy: 880,
    outputVolume: 200,
    outputUnit: 'هزار مترمکعب',
    targetReductionPct: 10,
  });
  assert.equal(metrics.baselineEnpi, 5);
  assert.equal(metrics.actualEnpi, 4.4);
  assert.equal(metrics.savedEnergy, 120);
  assert.equal(metrics.variancePct, -12);
  assert.equal(metrics.improved, true);

  const summary = computeSeuCoverageSummary([
    {
      id: 'e1',
      consumerName: 'SEU 1',
      unit: 'U1',
      carrier: 'برق (Electricity)',
      isSeu: true,
      enbBaseline: 1000,
      actualEnergy: 800,
      outputVolume: 100,
      outputUnit: 'تن',
      targetReductionPct: 10,
    },
    {
      id: 'e2',
      consumerName: 'Non-SEU',
      unit: 'U2',
      carrier: 'برق (Electricity)',
      isSeu: false,
      enbBaseline: 200,
      actualEnergy: 200,
      outputVolume: 100,
      outputUnit: 'ساعت',
      targetReductionPct: 5,
    },
  ]);
  assert.equal(summary.seuSharePct, 80);
});

test('ISO 55001 asset criticality maps consequence x likelihood to 4 tiers', () => {
  assert.equal(calculateAssetCriticality(5, 4).level, 'critical');
  assert.equal(calculateAssetCriticality(4, 3).level, 'high');
  assert.equal(calculateAssetCriticality(3, 2).level, 'medium');
  assert.equal(calculateAssetCriticality(2, 2).level, 'low');
});

test('UTF-8 BOM CSV builder and JSON backup validator work reliably', () => {
  const csv = buildUtf8Csv(['کد', 'عنوان'], [['DOC-1', 'خط‌مشی "یکپارچه", IMS']]);
  assert.ok(csv.startsWith('\uFEFF'));
  assert.ok(csv.includes('"خط‌مشی ""یکپارچه"", IMS"'));

  const bad = validateImportedProjectJson('{invalid');
  assert.equal(bad.ok, false);

  const missingFields = validateImportedProjectJson(JSON.stringify({ version: 1 }));
  assert.equal(missingFields.ok, false);
});
