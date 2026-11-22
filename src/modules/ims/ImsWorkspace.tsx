import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Boxes,
  Calculator,
  FileDown,
  FolderTree,
  LayoutDashboard,
  X,
} from 'lucide-react';
import { toPersianDigits } from '../../simulation/engine';
import {
  computeImsReadiness,
  makeEvaluationKey,
  syncAutoCapaForEvaluation,
} from './calculations';
import {
  createDefaultImsState,
  loadImsProjectState,
  saveImsProjectState,
} from './storage';
import { ImsDashboardGap } from './components/ImsDashboardGap';
import { ImsCapaTab } from './components/ImsCapaTab';
import { ImsAssetHub } from './components/ImsAssetHub';
import { ImsCalculators } from './components/ImsCalculators';
import { ImsDocumentMap } from './components/ImsDocumentMap';
import { ImsExportReport } from './components/ImsExportReport';
import type {
  AssetProcessEntity,
  DocumentMapEntry,
  GapEvaluation,
  ImsCapaItem,
  ImsProjectState,
  IsoStandardCode,
} from './types';

type ImsTabId =
  | 'dashboard'
  | 'capa'
  | 'asset_hub'
  | 'calculators'
  | 'documents'
  | 'export';

interface ImsWorkspaceProps {
  isSoftwareGl: boolean;
  onClose: () => void;
}

const NAV_TABS: Array<{
  id: ImsTabId;
  label: string;
  shortLabel: string;
  icon: typeof LayoutDashboard;
}> = [
  {
    id: 'dashboard',
    label: 'داشبورد و تحلیل شکاف',
    shortLabel: 'تحلیل شکاف',
    icon: LayoutDashboard,
  },
  {
    id: 'capa',
    label: 'اقدامات اصلاحی (CAPA)',
    shortLabel: 'CAPA',
    icon: AlertTriangle,
  },
  {
    id: 'asset_hub',
    label: 'مرکز تجهیزات (۴ بُعدی)',
    shortLabel: 'تجهیزات ۴D',
    icon: Boxes,
  },
  {
    id: 'calculators',
    label: 'محاسبه‌گرهای عملیاتی',
    shortLabel: 'محاسبه‌گرها',
    icon: Calculator,
  },
  {
    id: 'documents',
    label: 'نقشه اطلاعات مدون',
    shortLabel: 'اطلاعات مدون',
    icon: FolderTree,
  },
  {
    id: 'export',
    label: 'گزارش ممیزی و پشتیبان',
    shortLabel: 'گزارش / پشتیبان',
    icon: FileDown,
  },
];

export function ImsWorkspace({ isSoftwareGl, onClose }: ImsWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<ImsTabId>('dashboard');
  const [project, setProject] = useState<ImsProjectState>(() =>
    createDefaultImsState()
  );
  const [hydrated, setHydrated] = useState(false);

  // Hydrate persisted state from IndexedDB / localStorage on mount
  useEffect(() => {
    let cancelled = false;
    loadImsProjectState().then((loaded) => {
      if (!cancelled) {
        setProject(loaded);
        setHydrated(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Persist automatically on every user update after hydration
  useEffect(() => {
    if (!hydrated) return;
    void saveImsProjectState(project);
  }, [project, hydrated]);

  const mutateProject = (updater: (prev: ImsProjectState) => ImsProjectState) => {
    setProject((prev) => {
      const next = updater(prev);
      return {
        ...next,
        lastUpdated: new Date().toISOString().slice(0, 10),
      };
    });
  };

  const handleUpdateEvaluation = (
    clauseNumber: string,
    standard: IsoStandardCode,
    patch: Partial<Pick<GapEvaluation, 'status' | 'notes' | 'evidenceLink'>>
  ) => {
    mutateProject((prev) => {
      const key = makeEvaluationKey(clauseNumber, standard);
      const current = prev.evaluations[key] ?? {
        key,
        clauseNumber,
        standard,
        status: 'in_progress' as const,
        notes: '',
        evidenceLink: '',
        updatedAt: prev.lastUpdated,
      };
      const updatedEval: GapEvaluation = {
        ...current,
        ...patch,
        updatedAt: new Date().toISOString().slice(0, 10),
      };
      const nextCapas =
        patch.status !== undefined
          ? syncAutoCapaForEvaluation(prev.capas, updatedEval)
          : prev.capas;

      return {
        ...prev,
        evaluations: {
          ...prev.evaluations,
          [key]: updatedEval,
        },
        capas: nextCapas,
      };
    });
  };

  const handleAddCapa = (item: Omit<ImsCapaItem, 'id' | 'createdAt'>) => {
    mutateProject((prev) => ({
      ...prev,
      capas: [
        {
          ...item,
          id: `capa-man-${Date.now()}`,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev.capas,
      ],
    }));
  };

  const handleUpdateCapa = (id: string, patch: Partial<ImsCapaItem>) => {
    mutateProject((prev) => ({
      ...prev,
      capas: prev.capas.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    }));
  };

  const handleDeleteCapa = (id: string) => {
    mutateProject((prev) => ({
      ...prev,
      capas: prev.capas.filter((c) => c.id !== id),
    }));
  };

  /**
   * "One Input, Four Dimensions": registering an entity once also populates
   * linked records in ISO 14001 Aspects, ISO 45001 HIRA, and ISO 50001 Energy Review.
   */
  const handleAddAsset = (assetData: Omit<AssetProcessEntity, 'id'>) => {
    const newId = `asset-${Date.now()}`;
    const newAsset: AssetProcessEntity = { ...assetData, id: newId };
    mutateProject((prev) => ({
      ...prev,
      assets: [newAsset, ...prev.assets],
      environmentalAspects: [
        {
          id: `asp-${newId}`,
          assetId: newId,
          activityOrAsset: newAsset.name,
          aspect: newAsset.iso14001.primaryAspect,
          impact: newAsset.iso14001.impactCategory,
          condition: 'نرمال',
          severity: newAsset.iso14001.severity,
          probability: newAsset.iso14001.probability,
          legalFactor: newAsset.iso14001.legalFactor,
          controlMeasure: newAsset.iso14001.operationalControl,
        },
        ...prev.environmentalAspects,
      ],
      hiraRisks: [
        {
          id: `hira-${newId}`,
          assetId: newId,
          activityOrAsset: newAsset.name,
          hazard: newAsset.iso45001.primaryHazard,
          consequence: 'حادثه شغلی یا آسیب تجهیزاتی',
          initialSeverity: newAsset.iso45001.initialSeverity,
          initialLikelihood: newAsset.iso45001.initialLikelihood,
          controlsApplied: newAsset.iso45001.controlsApplied,
          controlAction: newAsset.iso45001.controlDescription,
          owner: 'سرپرست واحد',
        },
        ...prev.hiraRisks,
      ],
      energyConsumers: [
        {
          id: `en-${newId}`,
          assetId: newId,
          consumerName: newAsset.name,
          unit: newAsset.unit,
          carrier: newAsset.iso50001.energyCarrier,
          isSeu: newAsset.iso50001.isSeu,
          enbBaseline: Math.max(1, Math.round(newAsset.iso50001.baselineEnb / 100)),
          actualEnergy: Math.max(0, Math.round(newAsset.iso50001.actualConsumption / 100)),
          outputVolume: newAsset.iso50001.productionOutput,
          outputUnit: 'واحد تولید',
          targetReductionPct: 8,
        },
        ...prev.energyConsumers,
      ],
    }));
  };

  const handleUpdateAsset = (id: string, next: AssetProcessEntity) => {
    mutateProject((prev) => ({
      ...prev,
      assets: prev.assets.map((a) => (a.id === id ? next : a)),
    }));
  };

  const handleDeleteAsset = (id: string) => {
    mutateProject((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== id),
    }));
  };

  const handleUpdateDocument = (id: string, patch: Partial<DocumentMapEntry>) => {
    mutateProject((prev) => ({
      ...prev,
      documents: prev.documents.map((d) => (d.id === id ? { ...d, ...patch } : d)),
    }));
  };

  const handleAddDocument = (entry: Omit<DocumentMapEntry, 'id'>) => {
    mutateProject((prev) => ({
      ...prev,
      documents: [{ ...entry, id: `doc-${Date.now()}` }, ...prev.documents],
    }));
  };

  const readiness = computeImsReadiness(project.evaluations);
  const openCapaCount = project.capas.filter((c) => c.status !== 'verified').length;

  const glassShell = isSoftwareGl
    ? 'bg-[#0b111e]/96 ring-1 ring-inset ring-white/20 shadow-[0_28px_70px_rgba(0,0,0,0.75)]'
    : 'bg-[#0b111e]/82 backdrop-blur-3xl ring-1 ring-inset ring-white/22 shadow-[0_28px_70px_rgba(0,0,0,0.7)]';

  return (
    <section
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="سامانه مدیریت یکپارچه پتروس (IMS)"
      data-testid="ims-workspace"
      className={`ims-workspace-root flex h-[92vh] w-full max-w-[1380px] flex-col overflow-hidden rounded-[26px] text-slate-100 ${glassShell}`}
    >
      {/* Top Spatial Header */}
      <header className="ims-no-print flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <h1 className="whitespace-nowrap text-[15px] font-bold tracking-tight text-white sm:text-[17px]">
              سامانه مدیریت یکپارچه (IMS)
            </h1>
            <span className="hidden text-[12px] text-slate-400 md:inline" dir="ltr">
              ISO 14001 · ISO 45001 · ISO 50001 · ISO 55001
            </span>
          </div>
          <p className="mt-0.5 truncate text-[11.5px] text-slate-400">
            {project.organizationName} · آمادگی کل ممیزی:{' '}
            <strong className="text-sky-300 tabular-nums">
              {toPersianDigits(readiness.overallPct)}٪
            </strong>
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('export')}
            className="hidden cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-white/[0.08] px-3 py-1.5 text-[12px] font-semibold text-slate-100 ring-1 ring-inset ring-white/15 transition-colors hover:bg-white/[0.15] sm:flex"
          >
            <FileDown className="h-3.5 w-3.5 text-sky-300" />
            <span>خروجی / پشتیبان</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            data-testid="btn-close-ims"
            aria-label="بستن سامانه IMS و بازگشت به صحنه سه‌بعدی"
            className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-white/[0.08] text-slate-200 ring-1 ring-inset ring-white/20 transition-colors hover:bg-white/20 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      {/* Mobile Horizontal Tab Strip (< lg) */}
      <nav
        aria-label="بخش‌های سامانه IMS"
        className="ims-no-print flex shrink-0 items-center gap-1 overflow-x-auto border-b border-white/10 px-3 py-2 lg:hidden"
      >
        {NAV_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              aria-current={active ? 'page' : undefined}
              data-testid={`ims-mobile-tab-${tab.id}`}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl px-3 py-1.5 text-[11.5px] font-semibold transition-colors ${
                active
                  ? 'bg-white/18 text-white ring-1 ring-inset ring-white/25'
                  : 'text-slate-300 hover:bg-white/[0.08]'
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              <span>{tab.shortLabel}</span>
              {tab.id === 'capa' && openCapaCount > 0 && (
                <span className="text-[10.5px] font-bold text-amber-300 tabular-nums">
                  ({toPersianDigits(openCapaCount)})
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Main Split Body: Desktop Right Sidebar + Scrollable Viewport */}
      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* Desktop Sidebar Navigation */}
        <aside className="ims-no-print hidden w-60 shrink-0 flex-col justify-between border-l border-white/10 bg-white/[0.02] p-3 lg:flex">
          <nav aria-label="ناوبری اصلی سامانه IMS" className="space-y-1">
            {NAV_TABS.map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={active ? 'page' : undefined}
                  data-testid={`ims-nav-${tab.id}`}
                  className={`flex w-full cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-right text-[12.5px] font-semibold transition-colors ${
                    active
                      ? 'bg-white/[0.14] text-white ring-1 ring-inset ring-white/20'
                      : 'text-slate-300 hover:bg-white/[0.06] hover:text-white'
                  }`}
                >
                  <span className="flex items-center gap-2.5 truncate">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        active ? 'text-sky-300' : 'text-slate-400'
                      }`}
                    />
                    <span className="truncate">{tab.label}</span>
                  </span>

                  {tab.id === 'capa' && openCapaCount > 0 && (
                    <span className="shrink-0 text-[11px] font-bold text-amber-300 tabular-nums">
                      {toPersianDigits(openCapaCount)}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="space-y-1 border-t border-white/10 pt-3 text-[11px] text-slate-400">
            <div className="flex items-center justify-between">
              <span>ذخیره‌سازی محلی</span>
              <span className="font-mono text-emerald-300" dir="ltr">
                IndexedDB
              </span>
            </div>
            <div className="flex items-center justify-between tabular-nums">
              <span>تجهیزات ۴ بُعدی</span>
              <span className="text-slate-200">
                {toPersianDigits(project.assets.length)} مورد
              </span>
            </div>
            <div className="flex items-center justify-between tabular-nums">
              <span>اسناد مدون</span>
              <span className="text-slate-200">
                {toPersianDigits(project.documents.length)} سند
              </span>
            </div>
          </div>
        </aside>

        {/* Main Content Canvas */}
        <div className="min-w-0 flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'dashboard' && (
            <ImsDashboardGap
              evaluations={project.evaluations}
              openCapaCount={openCapaCount}
              onUpdateEvaluation={handleUpdateEvaluation}
              onJumpToCapa={() => setActiveTab('capa')}
            />
          )}

          {activeTab === 'capa' && (
            <ImsCapaTab
              capas={project.capas}
              onAddCapa={handleAddCapa}
              onUpdateCapa={handleUpdateCapa}
              onDeleteCapa={handleDeleteCapa}
            />
          )}

          {activeTab === 'asset_hub' && (
            <ImsAssetHub
              assets={project.assets}
              onAddAsset={handleAddAsset}
              onUpdateAsset={handleUpdateAsset}
              onDeleteAsset={handleDeleteAsset}
            />
          )}

          {activeTab === 'calculators' && (
            <ImsCalculators
              assets={project.assets}
              environmentalAspects={project.environmentalAspects}
              legalRegister={project.legalRegister}
              hiraRisks={project.hiraRisks}
              energyConsumers={project.energyConsumers}
              samp={project.samp}
              onUpdateAspects={(next) =>
                mutateProject((p) => ({ ...p, environmentalAspects: next }))
              }
              onUpdateLegal={(next) =>
                mutateProject((p) => ({ ...p, legalRegister: next }))
              }
              onUpdateHira={(next) =>
                mutateProject((p) => ({ ...p, hiraRisks: next }))
              }
              onUpdateEnergy={(next) =>
                mutateProject((p) => ({ ...p, energyConsumers: next }))
              }
              onUpdateSamp={(next) =>
                mutateProject((p) => ({ ...p, samp: next }))
              }
            />
          )}

          {activeTab === 'documents' && (
            <ImsDocumentMap
              documents={project.documents}
              onUpdateDocument={handleUpdateDocument}
              onAddDocument={handleAddDocument}
            />
          )}

          {activeTab === 'export' && (
            <ImsExportReport
              project={project}
              onImportProject={(next) => setProject(next)}
              onResetDemoData={() => setProject(createDefaultImsState())}
              onUpdateOrgName={(organizationName) =>
                mutateProject((p) => ({ ...p, organizationName }))
              }
            />
          )}
        </div>
      </div>
    </section>
  );
}
