import { useState } from 'react';
import {
  Cpu,
  Flame,
  Leaf,
  Plus,
  ShieldAlert,
  Trash2,
  Zap,
} from 'lucide-react';
import { toPersianDigits } from '../../../simulation/engine';
import {
  CONTROL_HIERARCHY_META,
  calculateAspectSignificance,
  calculateAssetCriticality,
  calculateHiraRisk,
} from '../calculations';
import type {
  AssetProcessEntity,
  ControlHierarchyLevel,
  LifecycleStage,
  MaintenanceStrategy,
} from '../types';

interface ImsAssetHubProps {
  assets: AssetProcessEntity[];
  onAddAsset: (asset: Omit<AssetProcessEntity, 'id'>) => void;
  onUpdateAsset: (id: string, next: AssetProcessEntity) => void;
  onDeleteAsset: (id: string) => void;
}

const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  design_acquire: 'طراحی و تملک',
  operate: 'بهره‌برداری فعال',
  maintain: 'نگهداری و تعمیرات اساسی',
  renew_dispose: 'نوسازی / خروج از سرویس',
};

const STRATEGY_LABELS: Record<MaintenanceStrategy, string> = {
  pdm: 'نگهداری پیش‌گویانه (PdM / CBM)',
  rcm: 'مبتنی بر قابلیت اطمینان (RCM)',
  pm: 'نگهداری پیشگیرانه (PM)',
  cm: 'نگهداری اصلاحی (CM)',
};

const ALL_CONTROL_LEVELS: ControlHierarchyLevel[] = [
  'elimination',
  'substitution',
  'engineering',
  'administrative',
  'ppe',
];

export function ImsAssetHub({
  assets,
  onAddAsset,
  onUpdateAsset,
  onDeleteAsset,
}: ImsAssetHubProps) {
  const [selectedId, setSelectedId] = useState<string>(assets[0]?.id ?? '');
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Quick-add form state
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [unit, setUnit] = useState('');
  const [entityType, setEntityType] = useState<'asset' | 'process' | 'unit'>('asset');
  const [isSeu, setIsSeu] = useState(true);
  const [primaryHazard, setPrimaryHazard] = useState('');
  const [primaryAspect, setPrimaryAspect] = useState('');
  const [formError, setFormError] = useState('');

  const selectedAsset =
    assets.find((a) => a.id === selectedId) ?? assets[0] ?? null;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !unit.trim()) {
      setFormError('لطفاً نام تجهیز/فرآیند و واحد سازمانی را وارد کنید.');
      return;
    }
    setFormError('');
    const crit = calculateAssetCriticality(4, 3);
    onAddAsset({
      name: name.trim(),
      code: code.trim() || `EQ-NEW-${assets.length + 1}`,
      unit: unit.trim(),
      entityType,
      iso55001: {
        criticality: crit.level,
        consequence: 4,
        likelihood: 3,
        lifecycleStage: 'operate',
        maintenanceStrategy: 'pm',
        replacementCostMillion: 8500,
      },
      iso50001: {
        isSeu,
        energyCarrier: 'برق (Electricity)',
        baselineEnb: 65000,
        actualConsumption: 61500,
        productionOutput: 500,
        enpiUnit: 'kWh / واحد تولید',
      },
      iso45001: {
        primaryHazard:
          primaryHazard.trim() || 'خطرات مکانیکی قطعات دوار، برق‌گرفتگی و تراز صدای بالا',
        initialSeverity: 4,
        initialLikelihood: 3,
        controlsApplied: ['engineering', 'administrative', 'ppe'],
        controlDescription: 'حفاظ مکانیکی، قفل و برچسب‌گذاری (LOTO) و تجهیزات حفاظت فردی',
      },
      iso14001: {
        primaryAspect:
          primaryAspect.trim() || 'مصرف آب/انرژی و احتمال نشت روغن روان‌کار به محیط',
        impactCategory: 'نشت و خاک',
        severity: 3,
        probability: 3,
        legalFactor: 2,
        operationalControl: 'سینی جمع‌آوری روغن (Drip Tray) و برنامه پایش دوره‌ای',
      },
    });
    setName('');
    setCode('');
    setUnit('');
    setPrimaryHazard('');
    setPrimaryAspect('');
    setShowCreateForm(false);
  };

  const toggleAssetControl = (
    asset: AssetProcessEntity,
    level: ControlHierarchyLevel
  ) => {
    const exists = asset.iso45001.controlsApplied.includes(level);
    const nextControls = exists
      ? asset.iso45001.controlsApplied.filter((c) => c !== level)
      : [...asset.iso45001.controlsApplied, level];
    onUpdateAsset(asset.id, {
      ...asset,
      iso45001: {
        ...asset.iso45001,
        controlsApplied: nextControls,
      },
    });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-[16px] font-bold text-white">
            مرکز تجهیزات و فرآیندها — الگوی «یک ورودی، چهار بُعد» (Asset &amp; Process Hub)
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-400">
            هر تجهیز یا فرآیند را تنها یک‌بار ثبت کنید و هر چهار بُعد ISO 55001، ISO 50001، ISO 45001 و ISO 14001 را به‌صورت یکپارچه مدیریت نمایید
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm((v) => !v)}
          data-testid="btn-add-hub-asset"
          className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-sky-500/20 px-3.5 py-2 text-[12px] font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/40 transition-colors hover:bg-sky-500/30"
        >
          <Plus className="h-4 w-4 text-sky-300" />
          <span>ثبت تجهیز / فرآیند جدید</span>
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          data-testid="form-add-hub-asset"
          className="space-y-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/15"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11.5px] text-slate-300">
                نام تجهیز، واحد یا فرآیند
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="مثلاً برج خنک‌کننده واحد ۲ (CT-202)"
                data-testid="input-asset-name"
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">کد تجهیز</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="EQ-UTL-202"
                dir="ltr"
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">واحد سازمانی</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="واحد یوتیلیتی"
                data-testid="input-asset-unit"
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">نوع موجودیت</label>
              <select
                value={entityType}
                onChange={(e) =>
                  setEntityType(e.target.value as 'asset' | 'process' | 'unit')
                }
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              >
                <option value="asset">تجهیز فیزیکی (Asset)</option>
                <option value="process">فرآیند عملیاتی (Process)</option>
                <option value="unit">واحد / ایستگاه (Unit)</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">
                مصرف‌کننده بارز انرژی (SEU)
              </label>
              <select
                value={isSeu ? 'yes' : 'no'}
                onChange={(e) => setIsSeu(e.target.value === 'yes')}
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              >
                <option value="yes">بله — SEU (ISO 50001)</option>
                <option value="no">خیر — مصرف عادی</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">
                خطر ایمنی اصلی (ISO 45001)
              </label>
              <input
                type="text"
                value={primaryHazard}
                onChange={(e) => setPrimaryHazard(e.target.value)}
                placeholder="مثلاً تماس با بخار داغ یا صدا"
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">
                جنبه زیست‌محیطی اصلی (ISO 14001)
              </label>
              <input
                type="text"
                value={primaryAspect}
                onChange={(e) => setPrimaryAspect(e.target.value)}
                placeholder="مثلاً بلوداون آب یا نشت روغن"
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
          </div>

          {formError && <p className="text-[12px] text-rose-300">{formError}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/10"
            >
              انصراف
            </button>
            <button
              type="submit"
              data-testid="btn-submit-hub-asset"
              className="cursor-pointer rounded-lg bg-emerald-500/25 px-4 py-1.5 text-[12px] font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-400/40 hover:bg-emerald-500/35"
            >
              ثبت یکپارچه در ۴ استاندارد
            </button>
          </div>
        </form>
      )}

      {/* Split Workspace: Registry List (Start) + 4-Dimension Unified Inspector (End) */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        {/* Left/Right Registry List */}
        <div className="space-y-2 lg:col-span-4">
          <div className="flex items-center justify-between px-1 text-[11.5px] text-slate-400">
            <span>فهرست موجودیت‌های ثبت‌شده ({toPersianDigits(assets.length)})</span>
            <span>انتخاب برای مدیریت ۴ بُعد</span>
          </div>

          <div className="divide-y divide-white/10 rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/10">
            {assets.map((asset) => {
              const active = selectedAsset?.id === asset.id;
              const crit = calculateAssetCriticality(
                asset.iso55001.consequence,
                asset.iso55001.likelihood
              );
              const aspectEval = calculateAspectSignificance(
                asset.iso14001.severity,
                asset.iso14001.probability,
                asset.iso14001.legalFactor
              );
              return (
                <button
                  key={asset.id}
                  type="button"
                  onClick={() => setSelectedId(asset.id)}
                  className={`flex w-full cursor-pointer flex-col gap-1.5 px-3.5 py-3 text-right transition-colors ${
                    active ? 'bg-white/[0.09]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13px] font-semibold text-white">
                      {asset.name}
                    </span>
                    <span className="font-mono text-[10.5px] text-slate-400" dir="ltr">
                      {asset.code}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                    <span>{asset.unit}</span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        crit.level === 'critical'
                          ? 'text-rose-300'
                          : crit.level === 'high'
                            ? 'text-amber-300'
                            : 'text-slate-300'
                      }
                    >
                      {crit.label}
                    </span>
                    {asset.iso50001.isSeu && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-sky-300">SEU</span>
                      </>
                    )}
                    {aspectEval.isSignificant && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="text-emerald-300">جنبه بارز</span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4-Dimension Unified Panel */}
        {selectedAsset ? (
          <div className="space-y-4 lg:col-span-8">
            {/* Entity Title Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/[0.04] px-4 py-3 ring-1 ring-inset ring-white/12">
              <div>
                <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
                  <span className="font-mono text-sky-300" dir="ltr">
                    {selectedAsset.code}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>{selectedAsset.unit}</span>
                </div>
                <h3 className="text-[15px] font-bold text-white">
                  {selectedAsset.name}
                </h3>
              </div>

              {assets.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteAsset(selectedAsset.id)}
                  aria-label={`حذف ${selectedAsset.name}`}
                  className="flex cursor-pointer items-center gap-1 rounded-lg px-2.5 py-1.5 text-[11.5px] text-rose-300 hover:bg-rose-500/15"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>حذف</span>
                </button>
              )}
            </div>

            {/* 2x2 Grid of the 4 ISO Dimensions */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {/* DIMENSION 1: ISO 55001 (Asset Management) */}
              {(() => {
                const crit = calculateAssetCriticality(
                  selectedAsset.iso55001.consequence,
                  selectedAsset.iso55001.likelihood
                );
                return (
                  <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Cpu className="h-4 w-4 text-violet-300" />
                        <span className="text-[13px] font-bold text-violet-200">
                          بُعد ISO 55001 (مدیریت دارایی)
                        </span>
                      </div>
                      <span className="text-[12px] font-semibold text-white tabular-nums">
                        {crit.label} ({toPersianDigits(crit.score)})
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-400">
                          پیامد خرابی (۱ تا ۵)
                        </label>
                        <select
                          value={selectedAsset.iso55001.consequence}
                          onChange={(e) => {
                            const c = Number(e.target.value) as 1 | 2 | 3 | 4 | 5;
                            const nextCrit = calculateAssetCriticality(
                              c,
                              selectedAsset.iso55001.likelihood
                            );
                            onUpdateAsset(selectedAsset.id, {
                              ...selectedAsset,
                              iso55001: {
                                ...selectedAsset.iso55001,
                                consequence: c,
                                criticality: nextCrit.level,
                              },
                            });
                          }}
                          className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {toPersianDigits(n)}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-400">
                          احتمال خرابی (۱ تا ۵)
                        </label>
                        <select
                          value={selectedAsset.iso55001.likelihood}
                          onChange={(e) => {
                            const l = Number(e.target.value) as 1 | 2 | 3 | 4 | 5;
                            const nextCrit = calculateAssetCriticality(
                              selectedAsset.iso55001.consequence,
                              l
                            );
                            onUpdateAsset(selectedAsset.id, {
                              ...selectedAsset,
                              iso55001: {
                                ...selectedAsset.iso55001,
                                likelihood: l,
                                criticality: nextCrit.level,
                              },
                            });
                          }}
                          className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
                        >
                          {[1, 2, 3, 4, 5].map((n) => (
                            <option key={n} value={n}>
                              {toPersianDigits(n)}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-400">
                          مرحله چرخه عمر (Lifecycle)
                        </label>
                        <select
                          value={selectedAsset.iso55001.lifecycleStage}
                          onChange={(e) =>
                            onUpdateAsset(selectedAsset.id, {
                              ...selectedAsset,
                              iso55001: {
                                ...selectedAsset.iso55001,
                                lifecycleStage: e.target.value as LifecycleStage,
                              },
                            })
                          }
                          className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] text-white ring-1 ring-inset ring-white/15"
                        >
                          {Object.entries(LIFECYCLE_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-400">
                          استراتژی نگهداری
                        </label>
                        <select
                          value={selectedAsset.iso55001.maintenanceStrategy}
                          onChange={(e) =>
                            onUpdateAsset(selectedAsset.id, {
                              ...selectedAsset,
                              iso55001: {
                                ...selectedAsset.iso55001,
                                maintenanceStrategy: e.target
                                  .value as MaintenanceStrategy,
                              },
                            })
                          }
                          className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] text-white ring-1 ring-inset ring-white/15"
                        >
                          {Object.entries(STRATEGY_LABELS).map(([k, v]) => (
                            <option key={k} value={k}>
                              {v}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* DIMENSION 2: ISO 50001 (Energy Management) */}
              {(() => {
                const enb = selectedAsset.iso50001.baselineEnb;
                const act = selectedAsset.iso50001.actualConsumption;
                const out = Math.max(1, selectedAsset.iso50001.productionOutput);
                const enpi = (act / out).toFixed(2);
                const deltaPct =
                  enb > 0 ? (((act - enb) / enb) * 100).toFixed(1) : '0.0';
                return (
                  <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-sky-300" />
                        <span className="text-[13px] font-bold text-sky-200">
                          بُعد ISO 50001 (انرژی و SEU)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          onUpdateAsset(selectedAsset.id, {
                            ...selectedAsset,
                            iso50001: {
                              ...selectedAsset.iso50001,
                              isSeu: !selectedAsset.iso50001.isSeu,
                            },
                          })
                        }
                        aria-pressed={selectedAsset.iso50001.isSeu}
                        className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset transition-colors ${
                          selectedAsset.iso50001.isSeu
                            ? 'bg-sky-500/25 text-sky-100 ring-sky-400/50'
                            : 'bg-white/[0.05] text-slate-400 ring-white/15'
                        }`}
                      >
                        {selectedAsset.iso50001.isSeu
                          ? 'SEU فعال (پرمصرف بارز)'
                          : 'غیر SEU'}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2.5">
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-400">
                          خط مبنای انرژی (EnB)
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={enb}
                          onChange={(e) =>
                            onUpdateAsset(selectedAsset.id, {
                              ...selectedAsset,
                              iso50001: {
                                ...selectedAsset.iso50001,
                                baselineEnb: Math.max(0, Number(e.target.value)),
                              },
                            })
                          }
                          dir="ltr"
                          className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white tabular-nums ring-1 ring-inset ring-white/15"
                        />
                      </div>
                      <div>
                        <label className="mb-1 block text-[11px] text-slate-400">
                          مصرف واقعی دوره
                        </label>
                        <input
                          type="number"
                          min={0}
                          value={act}
                          onChange={(e) =>
                            onUpdateAsset(selectedAsset.id, {
                              ...selectedAsset,
                              iso50001: {
                                ...selectedAsset.iso50001,
                                actualConsumption: Math.max(0, Number(e.target.value)),
                              },
                            })
                          }
                          dir="ltr"
                          className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white tabular-nums ring-1 ring-inset ring-white/15"
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11.5px] tabular-nums">
                      <span className="text-slate-300">
                        شاخص EnPI:{' '}
                        <strong className="text-white" dir="ltr">
                          {enpi}
                        </strong>{' '}
                        <span className="text-slate-400">
                          ({selectedAsset.iso50001.enpiUnit})
                        </span>
                      </span>
                      <span
                        className={
                          Number(deltaPct) <= 0
                            ? 'font-semibold text-emerald-300'
                            : 'font-semibold text-rose-300'
                        }
                        dir="ltr"
                      >
                        {Number(deltaPct) <= 0 ? '' : '+'}
                        {deltaPct}% vs EnB
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* DIMENSION 3: ISO 45001 (OH&S — HIRA & Controls) */}
              {(() => {
                const risk = calculateHiraRisk(
                  selectedAsset.iso45001.initialSeverity,
                  selectedAsset.iso45001.initialLikelihood,
                  selectedAsset.iso45001.controlsApplied
                );
                return (
                  <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="h-4 w-4 text-amber-300" />
                        <span className="text-[13px] font-bold text-amber-200">
                          بُعد ISO 45001 (ایمنی و HIRA)
                        </span>
                      </div>
                      <span className="text-[11.5px] text-slate-300 tabular-nums">
                        اولیه{' '}
                        <strong className="text-rose-300">
                          {toPersianDigits(risk.initialScore)}
                        </strong>{' '}
                        ← باقی‌مانده{' '}
                        <strong className="text-emerald-300">
                          {toPersianDigits(risk.residualScore)}
                        </strong>
                      </span>
                    </div>

                    <p className="text-[12px] leading-relaxed text-slate-200">
                      {selectedAsset.iso45001.primaryHazard}
                    </p>

                    <div>
                      <span className="mb-1.5 block text-[11px] text-slate-400">
                        سلسله‌مراتب کنترل‌های اعمال‌شده (Hierarchy of Controls):
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {ALL_CONTROL_LEVELS.map((lvl) => {
                          const on =
                            selectedAsset.iso45001.controlsApplied.includes(lvl);
                          return (
                            <button
                              key={lvl}
                              type="button"
                              onClick={() => toggleAssetControl(selectedAsset, lvl)}
                              aria-pressed={on}
                              className={`cursor-pointer rounded-lg px-2 py-1 text-[11px] font-medium ring-1 ring-inset transition-colors ${
                                on
                                  ? 'bg-amber-400/20 text-amber-100 ring-amber-300/45'
                                  : 'bg-white/[0.03] text-slate-400 ring-white/10 hover:text-slate-200'
                              }`}
                            >
                              {CONTROL_HIERARCHY_META[lvl].label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* DIMENSION 4: ISO 14001 (Environmental Aspects) */}
              {(() => {
                const asp = calculateAspectSignificance(
                  selectedAsset.iso14001.severity,
                  selectedAsset.iso14001.probability,
                  selectedAsset.iso14001.legalFactor
                );
                return (
                  <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10">
                    <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                      <div className="flex items-center gap-2">
                        <Leaf className="h-4 w-4 text-emerald-300" />
                        <span className="text-[13px] font-bold text-emerald-200">
                          بُعد ISO 14001 (محیط زیست)
                        </span>
                      </div>
                      <span
                        className={`text-[11.5px] font-semibold tabular-nums ${
                          asp.isSignificant ? 'text-rose-300' : 'text-emerald-300'
                        }`}
                      >
                        {asp.bandLabel} ({toPersianDigits(asp.score)})
                      </span>
                    </div>

                    <div className="flex items-center gap-2 text-[11.5px] text-slate-400">
                      <Flame className="h-3.5 w-3.5 text-emerald-300" />
                      <span>دسته پیامد: {selectedAsset.iso14001.impactCategory}</span>
                    </div>

                    <p className="text-[12px] leading-relaxed text-slate-200">
                      {selectedAsset.iso14001.primaryAspect}
                    </p>

                    <p className="border-t border-white/10 pt-2 text-[11.5px] text-slate-400">
                      <strong className="text-slate-300">کنترل عملیاتی:</strong>{' '}
                      {selectedAsset.iso14001.operationalControl}
                    </p>
                  </div>
                );
              })()}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
