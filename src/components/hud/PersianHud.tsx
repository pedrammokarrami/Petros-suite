import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  Bot,
  ChevronDown,
  ChevronUp,
  Cpu,
  Gauge,
} from 'lucide-react';
import { ModuleDock } from './ModuleDock';
import { ArchitectureDrawer } from '../modules/ArchitectureDrawer';
import { DocumentAiDrawer } from '../modules/DocumentAiDrawer';
import { Profile360Drawer } from '../modules/Profile360Drawer';
import { ComplianceDrawer } from '../modules/ComplianceDrawer';
import {
  UI_TRANSLATIONS,
  formatLocaleDigits,
  formatPercent,
} from '../../i18n/translations';
import type {
  SimHudSnapshot,
  SimMode,
  SpeedMultiplier,
} from '../../simulation/types';
import type {
  ComplianceClause,
  DocumentAnalysisResult,
  PlatformModule,
  ProcessArchNode,
  ZoneFocusId,
} from '../../platform/types';
import type { Locale } from '../../i18n/types';

interface PersianHudProps {
  mode: SimMode;
  locale: Locale;
  speed: SpeedMultiplier;
  autoSpawn: boolean;
  snapshot: SimHudSnapshot;
  isSoftwareGl: boolean;
  activeModule: PlatformModule;
  focusedZone: ZoneFocusId;
  activeArchNodeId: string;
  selectedStation: Exclude<ZoneFocusId, 'overview'>;
  clauses: ComplianceClause[];
  resolvedCapaCount: number;
  latestAnalysis: DocumentAnalysisResult | null;
  onModeChange: (mode: SimMode) => void;
  onLocaleChange: (locale: Locale) => void;
  onSpeedChange: (speed: SpeedMultiplier) => void;
  onSpawnPacket: () => void;
  onToggleAutoSpawn: () => void;
  onSelectModule: (module: PlatformModule) => void;
  onSelectArchNode: (node: ProcessArchNode) => void;
  onSelectStation: (station: Exclude<ZoneFocusId, 'overview'>) => void;
  onFocusZone: (zone: ZoneFocusId) => void;
  onApplyDocumentAnalysis: (result: DocumentAnalysisResult) => void;
  onApplyCapa: (clauseId: string) => void;
}

/**
 * Apple VisionOS & iOS 27 Spatial Glass HUD Overlay.
 * Keeps 90% of the photorealistic 3D viewport unobstructed, provides an iOS 27
 * FA | EN language segmented control, collapsible KPI pill, floating VisionOS
 * bottom dock, and centered glass modals with backdrop dimming.
 */
export function PersianHud({
  mode,
  locale,
  speed,
  autoSpawn,
  snapshot,
  isSoftwareGl,
  activeModule,
  focusedZone,
  activeArchNodeId,
  selectedStation,
  clauses,
  resolvedCapaCount,
  latestAnalysis,
  onModeChange,
  onLocaleChange,
  onSpeedChange,
  onSpawnPacket,
  onToggleAutoSpawn,
  onSelectModule,
  onSelectArchNode,
  onSelectStation,
  onFocusZone,
  onApplyDocumentAnalysis,
  onApplyCapa,
}: PersianHudProps) {
  const isToBe = mode === 'TO_BE';
  const isRtl = locale === 'fa';
  const t = UI_TRANSLATIONS[locale];

  // Minimized pill by default on mobile (< 768px) so 90% of the 3D scene remains open
  const [statusExpanded, setStatusExpanded] = useState<boolean>(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );

  // Close active modal on Escape key
  useEffect(() => {
    if (!activeModule) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onSelectModule(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeModule, onSelectModule]);

  const glassPill = isSoftwareGl
    ? 'bg-slate-900/86 ring-1 ring-inset ring-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.55)]'
    : 'bg-white/[0.08] backdrop-blur-3xl ring-1 ring-inset ring-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)]';

  const openNonconformityCount = clauses.filter(
    (c) => c.status === 'nonconformity'
  ).length;

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="pointer-events-none fixed inset-0 z-20 flex flex-col justify-between p-2.5 sm:p-5"
    >
      {/* ================================================================= */}
      {/* TOP VISIONOS FLOATING CONTROL BAR + COLLAPSIBLE STATUS PILL       */}
      {/* ================================================================= */}
      <div className="flex flex-col gap-2.5">
        <header className="flex w-full items-center justify-between gap-2">
          {/* Brand Pill */}
          <div
            className={`pointer-events-auto flex shrink-0 items-center gap-2 rounded-full px-3 py-1.5 sm:px-4 sm:py-2 ${glassPill}`}
          >
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/30 to-emerald-400/25 text-sky-200 ring-1 ring-inset ring-white/30">
              <Cpu className="h-3.5 w-3.5" />
            </div>
            <h1 className="whitespace-nowrap text-[12px] font-bold tracking-tight text-white sm:text-[13.5px]">
              <span className="hidden sm:inline">{t.brandFull}</span>
              <span className="inline sm:hidden">{t.brandShort}</span>
            </h1>
          </div>

          {/* Center Segmented Simulation Mode Toggle (AS-IS vs TO-BE) */}
          <div
            role="group"
            aria-label={t.modeGroupAria}
            className={`pointer-events-auto flex shrink-0 items-center gap-1 rounded-full p-1 ${glassPill}`}
          >
            <button
              type="button"
              onClick={() => onModeChange('AS_IS')}
              aria-pressed={!isToBe}
              data-testid="btn-mode-as-is"
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-300 ease-out active:scale-95 sm:px-4 sm:text-[12px] ${
                !isToBe
                  ? 'bg-amber-400/25 text-amber-100 ring-1 ring-inset ring-amber-300/55 shadow-[0_6px_20px_rgba(245,158,11,0.28)]'
                  : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span className="hidden lg:inline">{t.modeAsIsFull}</span>
              <span className="inline lg:hidden">{t.modeAsIsShort}</span>
            </button>

            <button
              type="button"
              onClick={() => onModeChange('TO_BE')}
              aria-pressed={isToBe}
              data-testid="btn-mode-to-be"
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-semibold transition-all duration-300 ease-out active:scale-95 sm:px-4 sm:text-[12px] ${
                isToBe
                  ? 'bg-emerald-400/25 text-emerald-100 ring-1 ring-inset ring-emerald-300/55 shadow-[0_6px_20px_rgba(16,185,129,0.28)]'
                  : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
              }`}
            >
              <span className="hidden lg:inline">{t.modeToBeFull}</span>
              <span className="inline lg:hidden">{t.modeToBeShort}</span>
            </button>
          </div>

          {/* Right Utility Controls: Speed + iOS 27 Segmented FA | EN Toggle */}
          <div className="pointer-events-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            {/* Compact Speed Selector (hidden on ultra-narrow < 420px to keep zero overflow) */}
            <div
              role="group"
              aria-label={t.speedGroupAria}
              className={`hidden items-center gap-0.5 rounded-full p-1 sm:flex ${glassPill}`}
            >
              <Gauge className="mx-1.5 h-3.5 w-3.5 text-slate-300" />
              {([1, 2] as SpeedMultiplier[]).map((mult) => (
                <button
                  key={mult}
                  type="button"
                  onClick={() => onSpeedChange(mult)}
                  aria-pressed={speed === mult}
                  aria-label={t.speedAria(mult)}
                  data-testid={`btn-speed-${mult}x`}
                  className={`cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-semibold tabular-nums transition-all duration-200 active:scale-95 ${
                    speed === mult
                      ? 'bg-white/22 text-white ring-1 ring-inset ring-white/30'
                      : 'text-slate-300 hover:text-white'
                  }`}
                >
                  {mult}x
                </button>
              ))}
            </div>

            {/* iOS 27 Bilingual Segmented Language Toggle (FA | EN) */}
            <div
              role="group"
              aria-label={t.langGroupAria}
              data-testid="lang-toggle"
              dir="ltr"
              className={`flex items-center gap-0.5 rounded-full p-1 ${glassPill}`}
            >
              {(['fa', 'en'] as Locale[]).map((code) => {
                const active = locale === code;
                return (
                  <button
                    key={code}
                    type="button"
                    onClick={() => onLocaleChange(code)}
                    aria-pressed={active}
                    data-testid={`lang-${code}`}
                    className={`cursor-pointer whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-bold tracking-wide transition-all duration-300 ease-out active:scale-95 ${
                      active
                        ? 'bg-white/25 text-white ring-1 ring-inset ring-white/40 shadow-[0_4px_14px_rgba(255,255,255,0.2)]'
                        : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    {code.toUpperCase()}
                  </button>
                );
              })}
            </div>
          </div>
        </header>

        {/* Compact Collapsible Process Telemetry Pill / Card */}
        <div className="flex justify-start">
          {!statusExpanded ? (
            <button
              type="button"
              onClick={() => setStatusExpanded(true)}
              data-testid="status-pill-collapsed"
              aria-label={t.statusExpandAria}
              className={`pointer-events-auto flex cursor-pointer items-center gap-2 rounded-full px-3.5 py-1.5 text-[11.5px] font-semibold transition-all duration-300 ease-out hover:bg-white/[0.14] active:scale-95 ${glassPill}`}
            >
              {isToBe ? (
                <Bot className="h-3.5 w-3.5 text-emerald-300" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
              )}
              <span className={isToBe ? 'text-emerald-200' : 'text-amber-200'}>
                {isToBe ? t.statusCompactToBe : t.statusCompactAsIs}
              </span>
              <span className="text-white/30">•</span>
              <span className="tabular-nums text-white">
                {isToBe ? t.cycleTimeToBe : t.cycleTimeAsIs}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-slate-300" />
            </button>
          ) : (
            <aside
              data-testid="status-card"
              aria-label={t.statusCardAria}
              className={`pointer-events-auto w-[264px] rounded-[22px] p-3.5 sm:w-[276px] ${glassPill}`}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {isToBe ? (
                    <Bot className="h-4 w-4 shrink-0 text-emerald-300" />
                  ) : (
                    <AlertTriangle className="h-4 w-4 shrink-0 text-amber-300" />
                  )}
                  <span
                    data-testid="status-card-heading"
                    className={`text-[12px] font-bold tracking-tight ${
                      isToBe ? 'text-emerald-200' : 'text-amber-200'
                    }`}
                  >
                    {isToBe ? t.statusFullToBe : t.statusFullAsIs}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setStatusExpanded(false)}
                  aria-label={t.statusCollapseAria}
                  data-testid="btn-collapse-status"
                  className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-300 transition-colors hover:bg-white/15 hover:text-white active:scale-95"
                >
                  <ChevronUp className="h-3.5 w-3.5" />
                </button>
              </div>

              <div className="mt-2.5 grid grid-cols-2 gap-1.5 text-[11px]">
                <div className="rounded-xl bg-white/[0.06] px-2.5 py-1.5 ring-1 ring-inset ring-white/10">
                  <span className="block text-[10px] text-slate-300/80">
                    {t.cycleTimeLabel}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      isToBe ? 'text-emerald-300' : 'text-amber-300'
                    }`}
                  >
                    {isToBe ? t.cycleTimeToBe : t.cycleTimeAsIs}
                  </span>
                </div>

                <div className="rounded-xl bg-white/[0.06] px-2.5 py-1.5 ring-1 ring-inset ring-white/10">
                  <span className="block text-[10px] text-slate-300/80">
                    {t.efficiencyLabel}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      isToBe ? 'text-emerald-300' : 'text-slate-100'
                    }`}
                  >
                    {formatPercent(isToBe ? 96 : 38, locale)}
                  </span>
                </div>

                <div className="rounded-xl bg-white/[0.06] px-2.5 py-1.5 ring-1 ring-inset ring-white/10">
                  <span className="block text-[10px] text-slate-300/80">
                    {t.queueLabel}
                  </span>
                  <span
                    className={`font-bold tabular-nums ${
                      snapshot.queueCount > 0
                        ? 'text-rose-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    {formatLocaleDigits(snapshot.queueCount, locale)}
                  </span>
                </div>

                <div className="rounded-xl bg-white/[0.06] px-2.5 py-1.5 ring-1 ring-inset ring-white/10">
                  <span className="block text-[10px] text-slate-300/80">
                    {t.completedLabel}
                  </span>
                  <span className="font-bold tabular-nums text-sky-200">
                    {formatLocaleDigits(snapshot.completedCount, locale)}
                  </span>
                </div>
              </div>
            </aside>
          )}
        </div>
      </div>

      {/* ================================================================= */}
      {/* CENTERED VISIONOS GLASS MODAL OVERLAY WITH BACKDROP DIMMING       */}
      {/* ================================================================= */}
      {activeModule !== null && (
        <div
          data-testid="modal-backdrop"
          onClick={() => onSelectModule(null)}
          className="pointer-events-auto fixed inset-0 z-30 flex items-center justify-center bg-slate-950/50 p-3 transition-opacity duration-200 sm:p-6"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex w-full items-center justify-center"
          >
            {activeModule === 'architecture' && (
              <ArchitectureDrawer
                mode={mode}
                locale={locale}
                isSoftwareGl={isSoftwareGl}
                activeNodeId={activeArchNodeId}
                focusedZone={focusedZone}
                onSelectNode={onSelectArchNode}
                onClose={() => onSelectModule(null)}
              />
            )}

            {activeModule === 'document_ai' && (
              <DocumentAiDrawer
                locale={locale}
                isSoftwareGl={isSoftwareGl}
                latestAnalysis={latestAnalysis}
                onApplyAnalysis={onApplyDocumentAnalysis}
                onClose={() => onSelectModule(null)}
              />
            )}

            {activeModule === 'profile_360' && (
              <Profile360Drawer
                mode={mode}
                locale={locale}
                isSoftwareGl={isSoftwareGl}
                selectedStation={selectedStation}
                resolvedCapaCount={resolvedCapaCount}
                onSelectStation={onSelectStation}
                onFocusZone={onFocusZone}
                onSwitchToBe={() => onModeChange('TO_BE')}
                onClose={() => onSelectModule(null)}
              />
            )}

            {activeModule === 'compliance' && (
              <ComplianceDrawer
                locale={locale}
                isSoftwareGl={isSoftwareGl}
                clauses={clauses}
                onApplyCapa={onApplyCapa}
                onFocusZone={onFocusZone}
                onClose={() => onSelectModule(null)}
              />
            )}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* FLOATING VISIONOS BOTTOM GLASS DOCK                               */}
      {/* ================================================================= */}
      <footer className="flex w-full items-center justify-center pb-0.5">
        <ModuleDock
          locale={locale}
          activeModule={activeModule}
          focusedZone={focusedZone}
          openNonconformityCount={openNonconformityCount}
          autoSpawn={autoSpawn}
          isSoftwareGl={isSoftwareGl}
          onSelectModule={onSelectModule}
          onResetCamera={() => onFocusZone('overview')}
          onSpawnPacket={onSpawnPacket}
          onToggleAutoSpawn={onToggleAutoSpawn}
        />
      </footer>
    </div>
  );
}
