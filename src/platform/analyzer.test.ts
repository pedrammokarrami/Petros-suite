import test from 'node:test';
import assert from 'node:assert/strict';
import {
  analyzeRegulationDocument,
  calculateMaturityBreakdown,
  findArchitectureNode,
  generateCapaForClause,
} from './analyzer';
import {
  ARCHITECTURE_TREE_BY_LOCALE,
  COMPLIANCE_CLAUSES_BY_LOCALE,
  SAMPLE_REGULATIONS_BY_LOCALE,
  UI_TRANSLATIONS,
} from '../i18n/translations';

test('baseline AS-IS maturity score equals 66% in both FA and EN with exact dimension scores', () => {
  for (const locale of ['fa', 'en'] as const) {
    const result = calculateMaturityBreakdown('AS_IS', 0, locale);
    assert.equal(result.overall, 66);

    const byKey = Object.fromEntries(result.dimensions.map((d) => [d.key, d.score]));
    assert.equal(byKey.owner, 90);
    assert.equal(byKey.documentation, 80);
    assert.equal(byKey.kpi, 65);
    assert.equal(byKey.risk, 70);
    assert.equal(byKey.digitalization, 40);
  }
});

test('switching to TO-BE and resolving CAPAs increases overall maturity score cleanly', () => {
  const asIs = calculateMaturityBreakdown('AS_IS', 0, 'en');
  const toBe = calculateMaturityBreakdown('TO_BE', 0, 'en');
  const toBeWithCapa = calculateMaturityBreakdown('TO_BE', 2, 'en');

  assert.ok(toBe.overall > asIs.overall + 20);
  assert.ok(toBeWithCapa.overall >= toBe.overall);
  assert.ok(toBeWithCapa.overall <= 99);
});

test('analyzeRegulationDocument extracts BPMN 2.0 flow and RACI matrix in both FA and EN', () => {
  const faRes = analyzeRegulationDocument(SAMPLE_REGULATIONS_BY_LOCALE.fa[0].text, 'fa');
  assert.ok(faRes.extractedStepsCount >= 4);
  assert.equal(faRes.processTitle, 'فرآیند خرید و تدارکات هوشمند سازمانی');
  assert.equal(faRes.bpmnNodes[0].type, 'start');
  assert.equal(faRes.bpmnNodes[faRes.bpmnNodes.length - 1].type, 'end');
  assert.equal(faRes.raciMatrix.length, faRes.extractedStepsCount);

  const enRes = analyzeRegulationDocument(SAMPLE_REGULATIONS_BY_LOCALE.en[0].text, 'en');
  assert.ok(enRes.extractedStepsCount >= 4);
  assert.equal(enRes.processTitle, 'Intelligent Refinery Procurement Process');
  assert.equal(enRes.bpmnNodes[0].label, 'Start Event');
  assert.ok(enRes.detectedBottlenecks >= 1);
});

test('analyzeRegulationDocument validates short input in active locale', () => {
  assert.throws(() => analyzeRegulationDocument('   ', 'fa'), /حداقل ۱۰ کاراکتر/);
  assert.throws(() => analyzeRegulationDocument('short', 'en'), /at least 10 characters/);
});

test('findArchitectureNode resolves L0 -> L3 nodes in both FA and EN trees', () => {
  const faAi = findArchitectureNode(ARCHITECTURE_TREE_BY_LOCALE.fa, 'l3-ai-policy');
  const enAi = findArchitectureNode(ARCHITECTURE_TREE_BY_LOCALE.en, 'l3-ai-policy');
  assert.equal(faAi?.zoneId, 'ai_core');
  assert.equal(enAi?.zoneId, 'ai_core');
  assert.ok(enAi?.title.includes('Autonomous AI'));
});

test('generateCapaForClause returns localized CAPA plans for FA and EN', () => {
  const faNc = COMPLIANCE_CLAUSES_BY_LOCALE.fa.find((c) => c.status === 'nonconformity')!;
  const enNc = COMPLIANCE_CLAUSES_BY_LOCALE.en.find((c) => c.status === 'nonconformity')!;
  const faCapa = generateCapaForClause(faNc, 'fa');
  const enCapa = generateCapaForClause(enNc, 'en');

  assert.ok(faCapa.correctiveAction.includes('SLA'));
  assert.ok(enCapa.correctiveAction.includes('SLA'));
  assert.equal(UI_TRANSLATIONS.en.modeAsIsShort, 'AS-IS');
  assert.equal(UI_TRANSLATIONS.fa.badges3d.approvalToBe, 'تایید خودکار با AI');
});
