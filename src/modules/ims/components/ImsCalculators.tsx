import { useState } from 'react';
import {
  Cpu,
  Leaf,
  Plus,
  Scale,
  ShieldAlert,
  Trash2,
  Zap,
} from 'lucide-react';
import { toPersianDigits } from '../../../simulation/engine';
import {
  CONTROL_HIERARCHY_META,
  calculateAspectSignificance,
  calculateAssetCriticality,
  calculateEnergyMetrics,
  calculateHiraRisk,
  computeSeuCoverageSummary,
} from '../calculations';
import type {
  AssetProcessEntity,
  ControlHierarchyLevel,
  EnergySeuRecord,
  EnvironmentalAspectRecord,
  HiraRiskRecord,
  IsoStandardCode,
  LegalRequirementRecord,
  SampPlan,
} from '../types';

interface ImsCalculatorsProps {
  assets: AssetProcessEntity[];
  environmentalAspects: EnvironmentalAspectRecord[];
  legalRegister: LegalRequirementRecord[];
  hiraRisks: HiraRiskRecord[];
  energyConsumers: EnergySeuRecord[];
  samp: SampPlan;
  onUpdateAspects: (next: EnvironmentalAspectRecord[]) => void;
  onUpdateLegal: (next: LegalRequirementRecord[]) => void;
  onUpdateHira: (next: HiraRiskRecord[]) => void;
  onUpdateEnergy: (next: EnergySeuRecord[]) => void;
  onUpdateSamp: (next: SampPlan) => void;
}

const CONTROL_LEVELS: ControlHierarchyLevel[] = [
  'elimination',
  'substitution',
  'engineering',
  'administrative',
  'ppe',
];

export function ImsCalculators({
  assets,
  environmentalAspects,
  legalRegister,
  hiraRisks,
  energyConsumers,
  samp,
  onUpdateAspects,
  onUpdateLegal,
  onUpdateHira,
  onUpdateEnergy,
  onUpdateSamp,
}: ImsCalculatorsProps) {
  const [activeTool, setActiveTool] = useState<IsoStandardCode>('14001');

  // --- ISO 14001 quick add ---
  const [newAspAsset, setNewAspAsset] = useState(assets[0]?.name ?? '');
  const [newAspText, setNewAspText] = useState('');
  const [newAspImpact, setNewAspImpact] = useState('');
  const [newAspS, setNewAspS] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [newAspP, setNewAspP] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [newAspL, setNewAspL] = useState<1 | 2 | 3>(2);
  const [newAspControl, setNewAspControl] = useState('');

  // --- ISO 45001 HIRA quick add ---
  const [newHiraAsset, setNewHiraAsset] = useState(assets[0]?.name ?? '');
  const [newHiraHazard, setNewHiraHazard] = useState('');
  const [newHiraConseq, setNewHiraConseq] = useState('');
  const [newHiraS, setNewHiraS] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [newHiraL, setNewHiraL] = useState<1 | 2 | 3 | 4 | 5>(4);
  const [newHiraControls, setNewHiraControls] = useState<ControlHierarchyLevel[]>([
    'engineering',
    'ppe',
  ]);

  // --- ISO 50001 Energy consumer quick add ---
  const [newEnName, setNewEnName] = useState('');
  const [newEnUnit, setNewEnUnit] = useState('واحد یوتیلیتی');
  const [newEnCarrier, setNewEnCarrier] =
    useState<EnergySeuRecord['carrier']>('برق (Electricity)');
  const [newEnBaseline, setNewEnBaseline] = useState(600);
  const [newEnActual, setNewEnActual] = useState(540);
  const [newEnOutput, setNewEnOutput] = useState(200);
  const [newEnSeu, setNewEnSeu] = useState(true);

  const [sampStep, setSampStep] = useState<number>(0);

  const handleAddAspect = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAspText.trim()) return;
    onUpdateAspects([
      {
        id: `asp-${Date.now()}`,
        activityOrAsset: newAspAsset || assets[0]?.name || 'عملیات سایت',
        aspect: newAspText.trim(),
        impact: newAspImpact.trim() || 'آلودگی زیست‌محیطی',
        condition: 'نرمال',
        severity: newAspS,
        probability: newAspP,
        legalFactor: newAspL,
        controlMeasure: newAspControl.trim() || 'پایش دوره‌ای و کنترل عملیاتی',
      },
      ...environmentalAspects,
    ]);
    setNewAspText('');
    setNewAspImpact('');
    setNewAspControl('');
  };

  const handleAddHira = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHiraHazard.trim()) return;
    onUpdateHira([
      {
        id: `hira-${Date.now()}`,
        activityOrAsset: newHiraAsset || assets[0]?.name || 'عملیات کارگاهی',
        hazard: newHiraHazard.trim(),
        consequence: newHiraConseq.trim() || 'آسیب جسمی یا حادثه شغلی',
        initialSeverity: newHiraS,
        initialLikelihood: newHiraL,
        controlsApplied: newHiraControls,
        controlAction: 'اجرای سلسله‌مراتب کنترل‌ها و بازرسی ایمنی',
        owner: 'سرپرست HSE',
      },
      ...hiraRisks,
    ]);
    setNewHiraHazard('');
    setNewHiraConseq('');
  };

  const handleAddEnergy = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEnName.trim()) return;
    onUpdateEnergy([
      {
        id: `en-${Date.now()}`,
        consumerName: newEnName.trim(),
        unit: newEnUnit.trim() || 'یوتیلیتی',
        carrier: newEnCarrier,
        isSeu: newEnSeu,
        enbBaseline: Math.max(1, Number(newEnBaseline)),
        actualEnergy: Math.max(0, Number(newEnActual)),
        outputVolume: Math.max(1, Number(newEnOutput)),
        outputUnit: 'واحد تولید',
        targetReductionPct: 8,
      },
      ...energyConsumers,
    ]);
    setNewEnName('');
  };

  const seuSummary = computeSeuCoverageSummary(energyConsumers);

  const sampSteps: Array<{
    title: string;
    field: keyof SampPlan;
    hint: string;
    multiline?: boolean;
  }> = [
    {
      title: '۱. ماموریت و افق برنامه‌ریزی (SAMP Scope)',
      field: 'organizationMission',
      hint: 'چگونه مدیریت دارایی به تحقق اهداف کلان کسب‌وکار کمک می‌کند؟',
      multiline: true,
    },
    {
      title: '۲. اهداف کمی مدیریت دارایی (Asset Objectives)',
      field: 'assetObjectives',
      hint: 'اهداف دسترس‌پذیری، قابلیت اطمینان، هزینه و کاهش انرژی (SMART)',
      multiline: true,
    },
    {
      title: '۳. سیاست رتبه‌بندی بحرانیت (Criticality Policy)',
      field: 'criticalityPolicy',
      hint: 'قواعد تصمیم‌گیری بر اساس ماتریس ۵×۵ پیامد × احتمال خرابی',
      multiline: true,
    },
    {
      title: '۴. استراتژی بودجه چرخه عمر (CAPEX / OPEX & LCC)',
      field: 'lifecycleFundingStrategy',
      hint: 'نحوه تخصیص بودجه نوسازی، نگهداری و ارزیابی خرید بر مبنای هزینه کل عمر',
      multiline: true,
    },
    {
      title: '۵. مدیریت ریسک، تاب‌آوری و شاخص‌های کلیدی (KPIs)',
      field: 'riskAndResilienceApproach',
      hint: 'تداوم عملیات، تک‌نقاط شکست، RCFA و شاخص‌های پایش SAMP',
      multiline: true,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Header + 4 Specialized Tool Switcher (always clean single-row tab bar) */}
      <div className="flex flex-col gap-3 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-[16px] font-bold text-white">
            محاسبه‌گرهای عملیاتی تخصصی چهار استاندارد (Operational Calculators)
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-400">
            متصل به مرکز تجهیزات و فرآیندها — محاسبه زنده جنبه‌های بارز، HIRA، شاخص EnPI/SEU و نقشه حرارتی بحرانیت دارایی
          </p>
        </div>

        <div
          role="tablist"
          aria-label="انتخاب ابزار محاسباتی استاندارد"
          className="flex w-fit max-w-full items-center gap-1 overflow-x-auto rounded-xl bg-white/[0.05] p-1 ring-1 ring-inset ring-white/12"
        >
          {(
            [
              { id: '14001', label: 'ISO 14001 · جنبه‌ها', icon: Leaf },
              { id: '45001', label: 'ISO 45001 · HIRA', icon: ShieldAlert },
              { id: '50001', label: 'ISO 50001 · SEU/EnPI', icon: Zap },
              { id: '55001', label: 'ISO 55001 · Heatmap & SAMP', icon: Cpu },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = activeTool === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                data-testid={`calc-tab-${tab.id}`}
                onClick={() => setActiveTool(tab.id)}
                className={`flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-colors ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ================================================================= */}
      {/* TOOL 1: ISO 14001 — ASPECTS & IMPACTS + LEGAL COMPLIANCE REGISTER */}
      {/* ================================================================= */}
      {activeTool === '14001' && (
        <div className="space-y-6">
          {/* Quick Aspect Entry */}
          <form
            onSubmit={handleAddAspect}
            className="grid grid-cols-1 gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/12 lg:grid-cols-12"
          >
            <div className="lg:col-span-3">
              <label className="mb-1 block text-[11px] text-slate-400">تجهیز / فعالیت (از مرکز دارایی)</label>
              <select
                value={newAspAsset}
                onChange={(e) => setNewAspAsset(e.target.value)}
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              >
                {assets.map((a) => (
                  <option key={a.id} value={a.name}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="lg:col-span-3">
              <label className="mb-1 block text-[11px] text-slate-400">جنبه زیست‌محیطی (Aspect)</label>
              <input
                type="text"
                value={newAspText}
                onChange={(e) => setNewAspText(e.target.value)}
                placeholder="مثلاً تخلیه پساب شستشوی مبدل"
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div className="lg:col-span-2">
              <label className="mb-1 block text-[11px] text-slate-400">پیامد (Impact)</label>
              <input
                type="text"
                value={newAspImpact}
                onChange={(e) => setNewAspImpact(e.target.value)}
                placeholder="آلودگی آب / خاک"
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div className="grid grid-cols-3 gap-1.5 lg:col-span-3">
              <div>
                <label className="mb-1 block text-[10.5px] text-slate-400">شدت (۱-۵)</label>
                <select
                  value={newAspS}
                  onChange={(e) => setNewAspS(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                  className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{toPersianDigits(n)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] text-slate-400">احتمال (۱-۵)</label>
                <select
                  value={newAspP}
                  onChange={(e) => setNewAspP(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                  className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <option key={n} value={n}>{toPersianDigits(n)}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-[10.5px] text-slate-400">قانونی (۱-۳)</label>
                <select
                  value={newAspL}
                  onChange={(e) => setNewAspL(Number(e.target.value) as 1 | 2 | 3)}
                  className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                >
                  <option value={1}>۱</option>
                  <option value={2}>۲</option>
                  <option value={3}>۳</option>
                </select>
              </div>
            </div>
            <div className="flex items-end lg:col-span-1">
              <button
                type="submit"
                className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-emerald-500/25 py-1.5 text-[12px] font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-400/40 hover:bg-emerald-500/35"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ثبت</span>
              </button>
            </div>
          </form>

          {/* Aspects Matrix Table */}
          <div className="overflow-x-auto rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/10">
            <table className="w-full min-w-[760px] text-right text-[12px]">
              <thead className="border-b border-white/10 text-[11px] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">تجهیز / فعالیت</th>
                  <th className="px-3 py-3 font-semibold">جنبه و پیامد زیست‌محیطی</th>
                  <th className="px-2 py-3 text-center font-semibold">شدت</th>
                  <th className="px-2 py-3 text-center font-semibold">احتمال</th>
                  <th className="px-2 py-3 text-center font-semibold">قانونی</th>
                  <th className="px-3 py-3 text-center font-semibold">امتیاز (آستانه ≥ ۲۴)</th>
                  <th className="px-3 py-3 font-semibold">کنترل عملیاتی</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {environmentalAspects.map((row) => {
                  const res = calculateAspectSignificance(
                    row.severity,
                    row.probability,
                    row.legalFactor
                  );
                  return (
                    <tr key={row.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-3 font-medium text-white">
                        {row.activityOrAsset}
                        <span className="block text-[10.5px] text-slate-400">
                          شرایط: {row.condition}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-200">
                        <div>{row.aspect}</div>
                        <div className="text-[11px] text-slate-400">{row.impact}</div>
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums">
                        <select
                          aria-label={`شدت جنبه ${row.aspect}`}
                          value={row.severity}
                          onChange={(e) =>
                            onUpdateAspects(
                              environmentalAspects.map((x) =>
                                x.id === row.id
                                  ? { ...x, severity: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }
                                  : x
                              )
                            )
                          }
                          className="rounded bg-slate-900 px-1.5 py-1 text-white ring-1 ring-white/15"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{toPersianDigits(n)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums">
                        <select
                          aria-label={`احتمال جنبه ${row.aspect}`}
                          value={row.probability}
                          onChange={(e) =>
                            onUpdateAspects(
                              environmentalAspects.map((x) =>
                                x.id === row.id
                                  ? { ...x, probability: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 }
                                  : x
                              )
                            )
                          }
                          className="rounded bg-slate-900 px-1.5 py-1 text-white ring-1 ring-white/15"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>{toPersianDigits(n)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-3 text-center tabular-nums">
                        <select
                          aria-label={`عامل قانونی ${row.aspect}`}
                          value={row.legalFactor}
                          onChange={(e) =>
                            onUpdateAspects(
                              environmentalAspects.map((x) =>
                                x.id === row.id
                                  ? { ...x, legalFactor: Number(e.target.value) as 1 | 2 | 3 }
                                  : x
                              )
                            )
                          }
                          className="rounded bg-slate-900 px-1.5 py-1 text-white ring-1 ring-white/15"
                        >
                          {[1, 2, 3].map((n) => (
                            <option key={n} value={n}>{toPersianDigits(n)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-3 py-3 text-center tabular-nums">
                        <div
                          className={`font-bold ${
                            res.isSignificant
                              ? 'text-rose-300'
                              : res.band === 'moderate'
                                ? 'text-amber-300'
                                : 'text-emerald-300'
                          }`}
                        >
                          {toPersianDigits(res.score)} · {res.bandLabel}
                        </div>
                      </td>
                      <td className="px-3 py-3 text-[11.5px] text-slate-300">
                        {row.controlMeasure}
                      </td>
                      <td className="px-2 py-3">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateAspects(
                              environmentalAspects.filter((x) => x.id !== row.id)
                            )
                          }
                          aria-label={`حذف جنبه ${row.aspect}`}
                          className="cursor-pointer rounded p-1 text-slate-400 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legal & Regulatory Compliance Register */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-emerald-300" />
              <h3 className="text-[14px] font-bold text-white">
                فهرست ثبت و ارزیابی الزامات قانونی و مقرراتی (Legal &amp; Compliance Register — بند ۶.۱.۳ و ۹.۱.۲)
              </h3>
            </div>
            <div className="divide-y divide-white/10 rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/10">
              {legalRegister.map((leg) => (
                <div
                  key={leg.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-[12px]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                      <span className="font-mono text-sky-300" dir="ltr">
                        {leg.regulationCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span dir="ltr">ISO {leg.standard}</span>
                      <span aria-hidden="true">·</span>
                      <span>{leg.authority}</span>
                    </div>
                    <div className="mt-0.5 font-medium text-white">{leg.title}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-slate-400 tabular-nums" dir="ltr">
                      بازبینی: {leg.nextReviewDate}
                    </span>
                    <select
                      aria-label={`وضعیت انطباق قانونی ${leg.regulationCode}`}
                      value={leg.complianceStatus}
                      onChange={(e) =>
                        onUpdateLegal(
                          legalRegister.map((l) =>
                            l.id === leg.id
                              ? {
                                  ...l,
                                  complianceStatus: e.target
                                    .value as LegalRequirementRecord['complianceStatus'],
                                }
                              : l
                          )
                        )
                      }
                      className={`cursor-pointer rounded-lg bg-slate-900 px-2.5 py-1 text-[11.5px] font-semibold ring-1 ring-inset ring-white/15 ${
                        leg.complianceStatus === 'compliant'
                          ? 'text-emerald-300'
                          : leg.complianceStatus === 'partial'
                            ? 'text-amber-300'
                            : 'text-rose-300'
                      }`}
                    >
                      <option value="compliant" className="bg-slate-900 text-emerald-300">
                        منطبق قانونی
                      </option>
                      <option value="partial" className="bg-slate-900 text-amber-300">
                        انطباق ناقص
                      </option>
                      <option value="non_compliant" className="bg-slate-900 text-rose-300">
                        عدم انطباق قانونی
                      </option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOOL 2: ISO 45001 — HIRA RISK MATRIX & 5-LEVEL HIERARCHY          */}
      {/* ================================================================= */}
      {activeTool === '45001' && (
        <div className="space-y-5">
          {/* Quick HIRA Form */}
          <form
            onSubmit={handleAddHira}
            className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/12"
          >
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-12">
              <div className="lg:col-span-3">
                <label className="mb-1 block text-[11px] text-slate-400">تجهیز / فعالیت</label>
                <select
                  value={newHiraAsset}
                  onChange={(e) => setNewHiraAsset(e.target.value)}
                  className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                >
                  {assets.map((a) => (
                    <option key={a.id} value={a.name}>{a.name}</option>
                  ))}
                </select>
              </div>
              <div className="lg:col-span-3">
                <label className="mb-1 block text-[11px] text-slate-400">خطر شناسایی‌شده (Hazard)</label>
                <input
                  type="text"
                  value={newHiraHazard}
                  onChange={(e) => setNewHiraHazard(e.target.value)}
                  placeholder="مثلاً کار در ارتفاع بالای ۳ متر"
                  className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                />
              </div>
              <div className="lg:col-span-3">
                <label className="mb-1 block text-[11px] text-slate-400">پیامد احتمالی</label>
                <input
                  type="text"
                  value={newHiraConseq}
                  onChange={(e) => setNewHiraConseq(e.target.value)}
                  placeholder="سقوط و آسیب شدید"
                  className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 lg:col-span-2">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">شدت (۱-۵)</label>
                  <select
                    value={newHiraS}
                    onChange={(e) => setNewHiraS(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{toPersianDigits(n)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">احتمال (۱-۵)</label>
                  <select
                    value={newHiraL}
                    onChange={(e) => setNewHiraL(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                    className="w-full rounded-lg bg-slate-900 px-2 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                  >
                    {[1, 2, 3, 4, 5].map((n) => (
                      <option key={n} value={n}>{toPersianDigits(n)}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-end lg:col-span-1">
                <button
                  type="submit"
                  className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-lg bg-amber-500/25 py-1.5 text-[12px] font-semibold text-amber-100 ring-1 ring-inset ring-amber-400/40 hover:bg-amber-500/35"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>ثبت</span>
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="text-slate-400">سلسله‌مراتب کنترل‌ها برای ردیف جدید:</span>
              {CONTROL_LEVELS.map((lvl) => {
                const active = newHiraControls.includes(lvl);
                return (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() =>
                      setNewHiraControls((prev) =>
                        prev.includes(lvl) ? prev.filter((c) => c !== lvl) : [...prev, lvl]
                      )
                    }
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${
                      active
                        ? 'bg-amber-400/20 text-amber-100 ring-amber-300/45'
                        : 'bg-white/[0.04] text-slate-400 ring-white/10'
                    }`}
                  >
                    {toPersianDigits(CONTROL_HIERARCHY_META[lvl].rank)}. {CONTROL_HIERARCHY_META[lvl].label}
                  </button>
                );
              })}
            </div>
          </form>

          {/* HIRA Matrix Cards */}
          <div className="divide-y divide-white/10 rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/10">
            {hiraRisks.map((row) => {
              const evalRes = calculateHiraRisk(
                row.initialSeverity,
                row.initialLikelihood,
                row.controlsApplied
              );
              return (
                <div key={row.id} className="space-y-3 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="text-[11.5px] text-slate-400">
                        {row.activityOrAsset} · مسئول: {row.owner}
                      </div>
                      <h4 className="mt-0.5 text-[13.5px] font-semibold text-white">
                        {row.hazard}
                      </h4>
                      <p className="text-[11.5px] text-slate-400">پیامد: {row.consequence}</p>
                    </div>

                    {/* Initial vs Residual Risk Comparison */}
                    <div className="flex items-center gap-4 text-[12px] tabular-nums">
                      <div className="text-center">
                        <span className="block text-[10.5px] text-slate-400">ریسک اولیه</span>
                        <span className="text-[15px] font-bold text-rose-300">
                          {toPersianDigits(evalRes.initialScore)}
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          {evalRes.initialLabel}
                        </span>
                      </div>
                      <span className="text-slate-500">←</span>
                      <div className="text-center">
                        <span className="block text-[10.5px] text-slate-400">ریسک باقی‌مانده</span>
                        <span
                          data-testid={`hira-residual-${row.id}`}
                          className={`text-[15px] font-bold ${
                            evalRes.residualBand === 'low' || evalRes.residualBand === 'medium'
                              ? 'text-emerald-300'
                              : 'text-amber-300'
                          }`}
                        >
                          {toPersianDigits(evalRes.residualScore)}
                        </span>
                        <span className="block text-[10px] text-emerald-300/90">
                          کاهش {toPersianDigits(evalRes.reductionPct)}٪
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateHira(hiraRisks.filter((h) => h.id !== row.id))
                        }
                        aria-label={`حذف ریسک ${row.hazard}`}
                        className="cursor-pointer rounded p-1 text-slate-400 hover:text-rose-300"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Interactive 5-Level Hierarchy of Controls toggles */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-[11px] text-slate-400">
                      اعمال سلسله‌مراتب ۵ سطحی کنترل‌ها:
                    </span>
                    {CONTROL_LEVELS.map((lvl) => {
                      const on = row.controlsApplied.includes(lvl);
                      return (
                        <button
                          key={lvl}
                          type="button"
                          data-testid={`hira-ctrl-${row.id}-${lvl}`}
                          aria-pressed={on}
                          onClick={() =>
                            onUpdateHira(
                              hiraRisks.map((h) => {
                                if (h.id !== row.id) return h;
                                const nextCtrls = on
                                  ? h.controlsApplied.filter((c) => c !== lvl)
                                  : [...h.controlsApplied, lvl];
                                return { ...h, controlsApplied: nextCtrls };
                              })
                            )
                          }
                          className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset transition-colors ${
                            on
                              ? 'bg-amber-400/22 text-amber-100 ring-amber-300/45'
                              : 'bg-white/[0.03] text-slate-400 ring-white/10 hover:text-white'
                          }`}
                        >
                          {toPersianDigits(CONTROL_HIERARCHY_META[lvl].rank)}. {CONTROL_HIERARCHY_META[lvl].label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOOL 3: ISO 50001 — ENERGY REVIEW, SEU TRACKER & EnPI SVG CHART   */}
      {/* ================================================================= */}
      {activeTool === '50001' && (
        <div className="space-y-6">
          {/* Top Summary + SVG EnB vs Actual Bar Chart */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="flex flex-col justify-between gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10 lg:col-span-4">
              <div>
                <h3 className="text-[14px] font-bold text-white">
                  خلاصه بازنگری انرژی و پوشش SEU
                </h3>
                <p className="mt-1 text-[11.5px] text-slate-400">
                  مقایسه کل مصرف واقعی نسبت به خط مبنای انرژی (EnB) و سهم مصرف‌کنندگان بارز (SEU)
                </p>
              </div>
              <div className="space-y-2.5 text-[12.5px] tabular-nums">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">خط مبنای کل (EnB):</span>
                  <strong className="text-white" dir="ltr">
                    {seuSummary.totalBaseline.toLocaleString()} MWh/GJ
                  </strong>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">مصرف واقعی کل:</span>
                  <strong className="text-sky-300" dir="ltr">
                    {seuSummary.totalActual.toLocaleString()} MWh/GJ
                  </strong>
                </div>
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="text-slate-400">سهم مصرف‌کنندگان بارز (SEU):</span>
                  <strong className="text-amber-300">
                    {toPersianDigits(seuSummary.seuSharePct)}٪ از کل انرژی
                  </strong>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">عملکرد نسبت به خط مبنا:</span>
                  <strong
                    className={
                      seuSummary.overallChangePct <= 0
                        ? 'text-emerald-300'
                        : 'text-rose-300'
                    }
                    dir="ltr"
                  >
                    {seuSummary.overallChangePct <= 0 ? '' : '+'}
                    {seuSummary.overallChangePct}%
                  </strong>
                </div>
              </div>
            </div>

            {/* Clean SVG Comparison Bar Chart (EnB vs Actual) */}
            <div className="rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10 lg:col-span-8">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[13.5px] font-bold text-white">
                  نمودار مقایسه‌ای خط مبنا (EnB) در برابر مصرف واقعی و شاخص EnPI
                </h3>
                <div className="flex items-center gap-4 text-[11px] text-slate-300">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-slate-500" />
                    خط مبنا (EnB)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-sky-400" />
                    مصرف واقعی (بهینه)
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-400" />
                    تجاوز از EnB
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {(() => {
                  const maxVal = Math.max(
                    1,
                    ...energyConsumers.map((c) => Math.max(c.enbBaseline, c.actualEnergy))
                  );
                  return energyConsumers.map((c) => {
                    const m = calculateEnergyMetrics(c);
                    const basePct = Math.round((c.enbBaseline / maxVal) * 100);
                    const actPct = Math.round((c.actualEnergy / maxVal) * 100);
                    return (
                      <div key={c.id} className="space-y-1">
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11.5px]">
                          <span className="font-medium text-white">
                            {c.consumerName}
                            {c.isSeu && (
                              <span className="mr-1.5 text-[10.5px] font-bold text-sky-300">
                                (SEU)
                              </span>
                            )}
                          </span>
                          <span className="text-slate-300 tabular-nums" dir="ltr">
                            EnPI: <strong>{m.actualEnpi}</strong> (vs {m.baselineEnpi}) ·{' '}
                            <span className={m.improved ? 'text-emerald-300' : 'text-rose-300'}>
                              {m.variancePct > 0 ? `+${m.variancePct}%` : `${m.variancePct}%`}
                            </span>
                          </span>
                        </div>
                        <div className="space-y-1">
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className="h-full rounded-full bg-slate-500/80"
                              style={{ width: `${basePct}%` }}
                            />
                          </div>
                          <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                            <div
                              className={`h-full rounded-full transition-all duration-300 ${
                                m.improved ? 'bg-sky-400' : 'bg-rose-400'
                              }`}
                              style={{ width: `${actPct}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>
          </div>

          {/* Quick Add Consumer Form */}
          <form
            onSubmit={handleAddEnergy}
            className="grid grid-cols-1 gap-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/12 sm:grid-cols-6"
          >
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] text-slate-400">نام مصرف‌کننده انرژی</label>
              <input
                type="text"
                value={newEnName}
                onChange={(e) => setNewEnName(e.target.value)}
                placeholder="مثلاً چیلر تراکمی خط ۲"
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">خط مبنا (EnB)</label>
              <input
                type="number"
                min={1}
                value={newEnBaseline}
                onChange={(e) => setNewEnBaseline(Number(e.target.value))}
                dir="ltr"
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white tabular-nums ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">مصرف واقعی</label>
              <input
                type="number"
                min={0}
                value={newEnActual}
                onChange={(e) => setNewEnActual(Number(e.target.value))}
                dir="ltr"
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white tabular-nums ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">حجم تولید / متغیر</label>
              <input
                type="number"
                min={1}
                value={newEnOutput}
                onChange={(e) => setNewEnOutput(Number(e.target.value))}
                dir="ltr"
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white tabular-nums ring-1 ring-inset ring-white/15"
              />
            </div>
            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={() => setNewEnSeu((v) => !v)}
                className={`cursor-pointer rounded-lg px-2 py-1.5 text-[11px] font-semibold ring-1 ring-inset ${
                  newEnSeu
                    ? 'bg-sky-500/20 text-sky-200 ring-sky-400/40'
                    : 'bg-white/[0.04] text-slate-400 ring-white/10'
                }`}
              >
                SEU
              </button>
              <button
                type="submit"
                className="flex flex-1 cursor-pointer items-center justify-center gap-1 rounded-lg bg-sky-500/25 py-1.5 text-[12px] font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/40 hover:bg-sky-500/35"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>ثبت</span>
              </button>
            </div>
          </form>

          {/* Editable Consumers Table */}
          <div className="overflow-x-auto rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/10">
            <table className="w-full min-w-[700px] text-right text-[12px]">
              <thead className="border-b border-white/10 text-[11px] text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-semibold">مصرف‌کننده و واحد</th>
                  <th className="px-3 py-3 font-semibold">حامل انرژی</th>
                  <th className="px-3 py-3 text-center font-semibold">SEU</th>
                  <th className="px-3 py-3 text-center font-semibold">EnB</th>
                  <th className="px-3 py-3 text-center font-semibold">مصرف واقعی</th>
                  <th className="px-3 py-3 text-center font-semibold">EnPI فعلی</th>
                  <th className="px-3 py-3 text-center font-semibold">تغییر ٪</th>
                  <th className="px-2 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10 tabular-nums">
                {energyConsumers.map((c) => {
                  const m = calculateEnergyMetrics(c);
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.03]">
                      <td className="px-4 py-2.5 font-medium text-white">
                        {c.consumerName}
                        <span className="block text-[10.5px] text-slate-400">{c.unit}</span>
                      </td>
                      <td className="px-3 py-2.5 text-slate-300">{c.carrier}</td>
                      <td className="px-3 py-2.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateEnergy(
                              energyConsumers.map((x) =>
                                x.id === c.id ? { ...x, isSeu: !x.isSeu } : x
                              )
                            )
                          }
                          className={`cursor-pointer rounded px-2 py-0.5 text-[11px] font-semibold ${
                            c.isSeu ? 'text-sky-300' : 'text-slate-500'
                          }`}
                        >
                          {c.isSeu ? 'بله (SEU)' : 'خیر'}
                        </button>
                      </td>
                      <td className="px-3 py-2.5 text-center" dir="ltr">
                        <input
                          type="number"
                          min={1}
                          value={c.enbBaseline}
                          onChange={(e) =>
                            onUpdateEnergy(
                              energyConsumers.map((x) =>
                                x.id === c.id
                                  ? { ...x, enbBaseline: Math.max(1, Number(e.target.value)) }
                                  : x
                              )
                            )
                          }
                          className="w-20 rounded bg-slate-900 px-2 py-1 text-center text-white ring-1 ring-white/15"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center" dir="ltr">
                        <input
                          type="number"
                          min={0}
                          value={c.actualEnergy}
                          onChange={(e) =>
                            onUpdateEnergy(
                              energyConsumers.map((x) =>
                                x.id === c.id
                                  ? { ...x, actualEnergy: Math.max(0, Number(e.target.value)) }
                                  : x
                              )
                            )
                          }
                          className="w-20 rounded bg-slate-900 px-2 py-1 text-center text-white ring-1 ring-white/15"
                        />
                      </td>
                      <td className="px-3 py-2.5 text-center font-semibold text-white" dir="ltr">
                        {m.actualEnpi}
                      </td>
                      <td
                        className={`px-3 py-2.5 text-center font-bold ${
                          m.improved ? 'text-emerald-300' : 'text-rose-300'
                        }`}
                        dir="ltr"
                      >
                        {m.variancePct > 0 ? `+${m.variancePct}%` : `${m.variancePct}%`}
                      </td>
                      <td className="px-2 py-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateEnergy(energyConsumers.filter((x) => x.id !== c.id))
                          }
                          aria-label={`حذف مصرف‌کننده ${c.consumerName}`}
                          className="cursor-pointer rounded p-1 text-slate-400 hover:text-rose-300"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* TOOL 4: ISO 55001 — 5x5 CRITICALITY HEATMAP & SAMP BUILDER        */}
      {/* ================================================================= */}
      {activeTool === '55001' && (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-12">
          {/* Interactive 5x5 Criticality Heatmap */}
          <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10 xl:col-span-6">
            <div>
              <h3 className="text-[14px] font-bold text-white">
                نقشه حرارتی بحرانیت دارایی‌ها (Asset Criticality Heatmap 5×5)
              </h3>
              <p className="mt-0.5 text-[11.5px] text-slate-400">
                موقعیت دارایی‌های ثبت‌شده در مرکز تجهیزات بر محورهای پیامد خرابی (عمودی) و احتمال خرابی (افقی)
              </p>
            </div>

            <div className="overflow-x-auto">
              <div className="min-w-[360px] space-y-1.5">
                {[5, 4, 3, 2, 1].map((consequence) => (
                  <div key={consequence} className="grid grid-cols-6 gap-1.5">
                    <div className="flex items-center justify-center text-[11px] font-semibold text-slate-400 tabular-nums">
                      پیامد {toPersianDigits(consequence)}
                    </div>
                    {[1, 2, 3, 4, 5].map((likelihood) => {
                      const crit = calculateAssetCriticality(consequence, likelihood);
                      const cellAssets = assets.filter(
                        (a) =>
                          a.iso55001.consequence === consequence &&
                          a.iso55001.likelihood === likelihood
                      );
                      const bgClass =
                        crit.level === 'critical'
                          ? 'bg-rose-500/28 ring-rose-400/40'
                          : crit.level === 'high'
                            ? 'bg-amber-500/24 ring-amber-400/35'
                            : crit.level === 'medium'
                              ? 'bg-sky-500/20 ring-sky-400/30'
                              : 'bg-emerald-500/18 ring-emerald-400/25';

                      return (
                        <div
                          key={`${consequence}-${likelihood}`}
                          className={`flex min-h-[58px] flex-col justify-between rounded-xl p-1.5 ring-1 ring-inset ${bgClass}`}
                        >
                          <span className="text-[10px] font-bold text-white/75 tabular-nums">
                            {toPersianDigits(crit.score)}
                          </span>
                          <div className="space-y-0.5">
                            {cellAssets.map((ca) => (
                              <div
                                key={ca.id}
                                dir="ltr"
                                title={`${ca.name} (${ca.code})`}
                                className="truncate rounded bg-slate-950/80 px-1.5 py-0.5 text-left font-mono text-[9px] font-semibold text-white"
                              >
                                {ca.code}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
                {/* X-axis labels */}
                <div className="grid grid-cols-6 gap-1.5 pt-1 text-center text-[10.5px] font-semibold text-slate-400 tabular-nums">
                  <div />
                  {[1, 2, 3, 4, 5].map((l) => (
                    <div key={l}>احتمال {toPersianDigits(l)}</div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Strategy Legend */}
            <div className="border-t border-white/10 pt-3 text-[11.5px] text-slate-300">
              <div className="grid grid-cols-2 gap-2">
                <span>• ۱۶–۲۵ (Tier 1): نگهداری پیش‌گویانه آنلاین (PdM)</span>
                <span>• ۱۰–۱۵ (Tier 2): مبتنی بر قابلیت اطمینان (RCM)</span>
                <span>• ۵–۹ (Tier 3): پیشگیرانه زمان‌بندی‌شده (PM)</span>
                <span>• ۱–۴ (Tier 4): اصلاحی کنترل‌شده (CM)</span>
              </div>
            </div>
          </div>

          {/* Step-by-Step SAMP Builder */}
          <div className="flex flex-col justify-between space-y-4 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10 xl:col-span-6">
            <div className="space-y-3">
              <div>
                <h3 className="text-[14px] font-bold text-white">
                  سازنده گام‌به‌گام طرح راهبردی مدیریت دارایی (SAMP Builder)
                </h3>
                <p className="mt-0.5 text-[11.5px] text-slate-400">
                  سند محوری استاندارد ISO 55001 — خروجی این بخش مستقیماً در گزارش ممیزی چاپ و ذخیره می‌شود
                </p>
              </div>

              {/* Step Selector */}
              <div className="flex flex-wrap gap-1.5">
                {sampSteps.map((st, idx) => (
                  <button
                    key={st.field}
                    type="button"
                    onClick={() => setSampStep(idx)}
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                      sampStep === idx
                        ? 'bg-violet-400/25 text-violet-100 ring-1 ring-inset ring-violet-300/45'
                        : 'bg-white/[0.04] text-slate-400 hover:text-white'
                    }`}
                  >
                    گام {toPersianDigits(idx + 1)}
                  </button>
                ))}
              </div>

              {/* Active Step Editor */}
              {(() => {
                const current = sampSteps[sampStep];
                return (
                  <div className="space-y-2">
                    <label className="block text-[13px] font-semibold text-violet-200">
                      {current.title}
                    </label>
                    <p className="text-[11.5px] text-slate-400">{current.hint}</p>
                    <textarea
                      rows={5}
                      value={samp[current.field]}
                      onChange={(e) =>
                        onUpdateSamp({
                          ...samp,
                          [current.field]: e.target.value,
                        })
                      }
                      className="w-full rounded-xl bg-slate-950/70 p-3 text-[12.5px] leading-relaxed text-slate-100 ring-1 ring-inset ring-white/15 focus:outline-none focus:ring-violet-400/60"
                    />
                  </div>
                );
              })()}

              {/* Compact KPI & Review Cycle fields */}
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    شاخص‌های کلیدی عملکرد SAMP (KPIs)
                  </label>
                  <input
                    type="text"
                    value={samp.kpiMetrics}
                    onChange={(e) =>
                      onUpdateSamp({ ...samp, kpiMetrics: e.target.value })
                    }
                    className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] text-white ring-1 ring-inset ring-white/15"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-[11px] text-slate-400">
                    چرخه بازنگری SAMP
                  </label>
                  <input
                    type="text"
                    value={samp.reviewCycle}
                    onChange={(e) =>
                      onUpdateSamp({ ...samp, reviewCycle: e.target.value })
                    }
                    className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] text-white ring-1 ring-inset ring-white/15"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <button
                type="button"
                disabled={sampStep === 0}
                onClick={() => setSampStep((s) => Math.max(0, s - 1))}
                className="cursor-pointer rounded-lg px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/10 disabled:opacity-40"
              >
                گام قبلی
              </button>
              <span className="text-[11.5px] text-slate-400 tabular-nums">
                گام {toPersianDigits(sampStep + 1)} از {toPersianDigits(sampSteps.length)} (ذخیره خودکار در IndexedDB)
              </span>
              <button
                type="button"
                disabled={sampStep === sampSteps.length - 1}
                onClick={() =>
                  setSampStep((s) => Math.min(sampSteps.length - 1, s + 1))
                }
                className="cursor-pointer rounded-lg bg-violet-500/25 px-3 py-1.5 text-[12px] font-semibold text-violet-100 ring-1 ring-inset ring-violet-400/40 hover:bg-violet-500/35 disabled:opacity-40"
              >
                گام بعدی
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
