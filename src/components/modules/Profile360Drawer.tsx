import {
  Activity,
  AlertTriangle,
  Bot,
  CheckCircle2,
  Gauge,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { calculateMaturityBreakdown } from '../../platform/analyzer';
import {
  STATION_PROFILES_BY_LOCALE,
  UI_TRANSLATIONS,
  formatLocaleDigits,
  formatPercent,
} from '../../i18n/translations';
import type { ZoneFocusId } from '../../platform/types';
import type { SimMode } from '../../simulation/types';
import type { Locale } from '../../i18n/types';

interface Profile360DrawerProps {
  mode: SimMode;
  locale: Locale;
  isSoftwareGl: boolean;
  selectedStation: Exclude<ZoneFocusId, 'overview'>;
  resolvedCapaCount: number;
  onSelectStation: (station: Exclude<ZoneFocusId, 'overview'>) => void;
  onFocusZone: (zone: ZoneFocusId) => void;
  onSwitchToBe: () => void;
  onClose: () => void;
}

const STATION_IDS: Array<Exclude<ZoneFocusId, 'overview'>> = [
  'intake',
  'approval',
  'ai_core',
  'logistics',
];

export function Profile360Drawer({
  mode,
  locale,
  isSoftwareGl,
  selectedStation,
  resolvedCapaCount,
  onSelectStation,
  onFocusZone,
  onSwitchToBe,
  onClose,
}: Profile360DrawerProps) {
  const t = UI_TRANSLATIONS[locale];
  const isRtl = locale === 'fa';
  const profile = STATION_PROFILES_BY_LOCALE[locale][selectedStation];
  const maturity = calculateMaturityBreakdown(mode, resolvedCapaCount, locale);
  const isToBe = mode === 'TO_BE';

  // Circular SVG gauge geometry (r = 38)
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset =
    circumference - (maturity.overall / 100) * circumference;

  const modalSurface = isSoftwareGl
    ? 'bg-slate-950/94 ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.75)]'
    : 'bg-slate-950/74 backdrop-blur-3xl ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.7)]';

  return (
    <section
      data-testid="drawer-profile-360"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`pointer-events-auto flex max-h-[84vh] w-full max-w-[740px] flex-col overflow-hidden rounded-[28px] text-slate-100 ${modalSurface}`}
    >
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-cyan-500/20 text-cyan-300 ring-1 ring-inset ring-cyan-400/35">
            <Gauge className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-white">
              {t.profile360.title}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-300/80">
              {t.profile360.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.profile360.closeAria}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-slate-200 ring-1 ring-inset ring-white/15 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Station Selector Segmented Tabs */}
      <div className="grid grid-cols-2 gap-1.5 border-b border-white/10 bg-white/[0.03] px-6 py-3 sm:grid-cols-4">
        {STATION_IDS.map((stationId) => {
          const active = selectedStation === stationId;
          return (
            <button
              key={stationId}
              type="button"
              onClick={() => {
                onSelectStation(stationId);
                onFocusZone(stationId);
              }}
              className={`cursor-pointer whitespace-nowrap rounded-full px-3 py-1.5 text-[11.5px] font-semibold transition-all duration-200 active:scale-95 ${
                active
                  ? 'bg-sky-500/25 text-sky-100 ring-1 ring-inset ring-sky-400/50 shadow-[0_6px_18px_rgba(14,165,233,0.22)]'
                  : 'bg-white/[0.04] text-slate-300 ring-1 ring-inset ring-white/10 hover:bg-white/[0.1] hover:text-white'
              }`}
            >
              {t.profile360.tabs[stationId]}
            </button>
          );
        })}
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {/* Station Identity Card */}
        <div className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-inset ring-white/12">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <h3 className="text-[14px] font-bold text-white">
                {profile.title}
              </h3>
              <p className="mt-1 flex items-center gap-1.5 text-[11.5px] text-slate-300">
                <UserCheck className="h-3.5 w-3.5 text-sky-400" />
                <span>{profile.ownerName}</span>
              </p>
            </div>
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-[10.5px] font-semibold text-slate-200 ring-1 ring-inset ring-white/15">
              {profile.roleTitle}
            </span>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2.5 text-[12px]">
            <div className="rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-inset ring-white/10">
              <span className="block text-[10.5px] text-slate-400">
                {t.profile360.currentCycle}
              </span>
              <span
                className={`mt-0.5 block font-bold tabular-nums ${
                  isToBe ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                {isToBe ? profile.toBeCycle : profile.currentCycle}
              </span>
            </div>
            <div className="rounded-xl bg-slate-950/60 px-3 py-2 ring-1 ring-inset ring-white/10">
              <span className="block text-[10.5px] text-slate-400">
                {t.profile360.slaTarget}
              </span>
              <span className="mt-0.5 block font-bold text-sky-200">
                {profile.slaTarget}
              </span>
            </div>
          </div>
        </div>

        {/* Process Maturity Gauge + 5 Dimension Bars */}
        <div className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-inset ring-white/12">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="relative mx-auto flex h-24 w-24 shrink-0 items-center justify-center sm:mx-0">
              <svg className="h-24 w-24 -rotate-90" viewBox="0 0 96 96">
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.12)"
                  strokeWidth="8"
                />
                <circle
                  cx="48"
                  cy="48"
                  r={radius}
                  fill="none"
                  stroke={maturity.overall >= 80 ? '#10b981' : '#38bdf8'}
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span
                  data-testid="maturity-score-value"
                  className="text-xl font-extrabold tabular-nums text-white"
                >
                  {formatPercent(maturity.overall, locale)}
                </span>
                <span className="text-[10px] text-slate-400">
                  {t.profile360.maturityScoreLabel}
                </span>
              </div>
            </div>

            <div className="min-w-0 flex-1 space-y-2">
              <div className="text-[12.5px] font-bold text-white">
                {t.profile360.maturityTitle}
              </div>
              {maturity.dimensions.map((dim) => (
                <div key={dim.key} className="space-y-1">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-200">{dim.label}</span>
                    <span className="font-semibold tabular-nums text-white">
                      {formatPercent(dim.score, locale)}
                    </span>
                  </div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        dim.score >= 80
                          ? 'bg-emerald-400'
                          : dim.score >= 60
                            ? 'bg-sky-400'
                            : 'bg-amber-400'
                      }`}
                      style={{ width: `${dim.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <p className="mt-3 rounded-xl bg-slate-950/60 px-3 py-2 text-[11.5px] text-cyan-200 ring-1 ring-inset ring-white/10">
            {maturity.nextLevelLabel}
          </p>
        </div>

        {/* Lean / Waste Analysis */}
        <div className="rounded-2xl bg-white/[0.05] p-4 ring-1 ring-inset ring-white/12">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="flex items-center gap-1.5 text-[12.5px] font-bold text-white">
              <Activity className="h-4 w-4 text-amber-400" />
              <span>{t.profile360.leanTitle}</span>
            </h3>
            {!isToBe && (
              <button
                type="button"
                onClick={onSwitchToBe}
                className="flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-500/20 px-3 py-1 text-[11px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/40 transition-all hover:bg-emerald-500/30 active:scale-95"
              >
                <Bot className="h-3.5 w-3.5" />
                <span>{t.profile360.fixWithToBe}</span>
              </button>
            )}
          </div>

          <div className="space-y-2">
            {profile.wastes.map((waste) => (
              <div
                key={waste.id}
                className={`flex items-start justify-between gap-3 rounded-xl px-3.5 py-2.5 text-[11.5px] ring-1 ring-inset ${
                  isToBe
                    ? 'bg-emerald-500/10 text-emerald-100 ring-emerald-400/25'
                    : 'bg-amber-500/10 text-amber-100 ring-amber-400/25'
                }`}
              >
                <div className="flex items-start gap-2">
                  {isToBe ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                  )}
                  <div>
                    <div className="font-semibold">{waste.title}</div>
                    <div className="mt-0.5 text-[10.5px] opacity-80">
                      {t.profile360.wasteTypePrefix} {waste.wasteType}
                    </div>
                  </div>
                </div>
                <span className="shrink-0 rounded-full bg-slate-950/60 px-2.5 py-0.5 text-[10.5px] font-bold tabular-nums">
                  {isToBe
                    ? t.profile360.wasteCleared
                    : `${formatLocaleDigits(waste.impactMinutes, locale)} ${t.profile360.wasteMinutesSuffix}`}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* AI Next-Level Recommendations */}
        <div className="rounded-2xl bg-sky-500/10 p-4 ring-1 ring-inset ring-sky-400/25">
          <h3 className="mb-2 flex items-center gap-1.5 text-[12.5px] font-bold text-sky-200">
            <Sparkles className="h-4 w-4" />
            <span>{t.profile360.aiRecsTitle}</span>
          </h3>
          <ul className="space-y-1.5 text-[12px] text-slate-200">
            {profile.aiRecommendations.map((rec) => (
              <li key={rec} className="flex items-start gap-2">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-sky-400" />
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
