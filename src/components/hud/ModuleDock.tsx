import {
  FileCode2,
  Gauge,
  Layers,
  Pause,
  Play,
  Plus,
  RotateCcw,
  ShieldCheck,
} from 'lucide-react';
import {
  UI_TRANSLATIONS,
  formatLocaleDigits,
} from '../../i18n/translations';
import type { PlatformModule, ZoneFocusId } from '../../platform/types';
import type { Locale } from '../../i18n/types';

interface ModuleDockProps {
  locale: Locale;
  activeModule: PlatformModule;
  focusedZone: ZoneFocusId;
  openNonconformityCount: number;
  autoSpawn: boolean;
  isSoftwareGl: boolean;
  onSelectModule: (module: PlatformModule) => void;
  onResetCamera: () => void;
  onSpawnPacket: () => void;
  onToggleAutoSpawn: () => void;
}

const MODULE_META: Array<{
  id: Exclude<PlatformModule, null>;
  icon: typeof Layers;
}> = [
  { id: 'architecture', icon: Layers },
  { id: 'document_ai', icon: FileCode2 },
  { id: 'profile_360', icon: Gauge },
  { id: 'compliance', icon: ShieldCheck },
];

/**
 * Floating Apple VisionOS / iOS 27 Spatial Glass Bottom Orb/Dock.
 * Combines the 4 Enterprise Process Engineering modules with compact simulation
 * injection controls so 90%+ of the photorealistic 3D viewport stays open.
 */
export function ModuleDock({
  locale,
  activeModule,
  focusedZone,
  openNonconformityCount,
  autoSpawn,
  isSoftwareGl,
  onSelectModule,
  onResetCamera,
  onSpawnPacket,
  onToggleAutoSpawn,
}: ModuleDockProps) {
  const t = UI_TRANSLATIONS[locale];

  const glassDock = isSoftwareGl
    ? 'bg-slate-900/88 ring-1 ring-inset ring-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.55)]'
    : 'bg-white/[0.08] backdrop-blur-3xl ring-1 ring-inset ring-white/25 shadow-[0_20px_50px_rgba(0,0,0,0.5)]';

  return (
    <nav
      aria-label={t.dockAria}
      data-testid="module-dock"
      className={`pointer-events-auto flex max-w-full items-center gap-0.5 rounded-full p-1 sm:gap-1.5 sm:px-2 sm:py-1.5 ${glassDock}`}
    >
      {/* 4 Core Platform Modules */}
      {MODULE_META.map((item) => {
        const Icon = item.icon;
        const active = activeModule === item.id;
        const showBadge =
          item.id === 'compliance' && openNonconformityCount > 0;
        const labels = t.dockModules[item.id];

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => onSelectModule(active ? null : item.id)}
            aria-pressed={active}
            data-testid={`dock-${item.id}`}
            className={`relative flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full px-2 py-1.5 text-[10.5px] font-semibold transition-all duration-300 ease-out active:scale-95 sm:gap-1.5 sm:px-3.5 sm:py-2 sm:text-[12px] ${
              active
                ? 'bg-white/22 text-white ring-1 ring-inset ring-white/35 shadow-[0_6px_22px_rgba(56,189,248,0.32)]'
                : 'text-slate-200 hover:bg-white/[0.12] hover:text-white'
            }`}
          >
            <Icon
              className={`h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4 ${
                active ? 'text-sky-300' : 'text-slate-300'
              }`}
            />
            <span className="hidden md:inline">{labels.label}</span>
            <span className="inline md:hidden">{labels.short}</span>
            {showBadge && (
              <span className="inline-flex h-4 min-w-[16px] items-center justify-center rounded-full bg-rose-500 px-1 text-[9.5px] font-bold tabular-nums text-white shadow-sm">
                {formatLocaleDigits(openNonconformityCount, locale)}
              </span>
            )}
          </button>
        );
      })}

      {/* Hairline Spatial Divider */}
      <div className="mx-0.5 h-5 w-px shrink-0 bg-white/18 sm:h-6" />

      {/* Compact Quick Request Spawn Button */}
      <button
        type="button"
        onClick={onSpawnPacket}
        data-testid="btn-spawn-packet"
        aria-label={t.spawnButton}
        className="flex h-8 w-8 shrink-0 cursor-pointer items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-sky-500/22 text-[11.5px] font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/40 transition-all duration-300 ease-out hover:bg-sky-500/32 active:scale-95 lg:h-auto lg:w-auto lg:px-3 lg:py-2"
      >
        <Plus className="h-3.5 w-3.5 shrink-0 text-sky-300 sm:h-4 sm:w-4" />
        <span className="hidden lg:inline">{t.spawnButtonShort}</span>
      </button>

      {/* Auto-Spawn Play/Pause Orb */}
      <button
        type="button"
        onClick={onToggleAutoSpawn}
        aria-pressed={autoSpawn}
        aria-label={autoSpawn ? t.autoSpawnOn : t.autoSpawnOff}
        data-testid="btn-auto-spawn"
        className={`hidden h-8 w-8 shrink-0 cursor-pointer items-center justify-center rounded-full ring-1 ring-inset transition-all duration-300 ease-out active:scale-95 sm:flex sm:h-9 sm:w-9 ${
          autoSpawn
            ? 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40 hover:bg-emerald-500/30'
            : 'bg-white/[0.06] text-slate-400 ring-white/15 hover:bg-white/[0.14] hover:text-white'
        }`}
      >
        {autoSpawn ? (
          <Pause className="h-3.5 w-3.5" />
        ) : (
          <Play className="h-3.5 w-3.5" />
        )}
      </button>

      {/* Reset Camera Overview Pill (shown when focused on a specific zone) */}
      {focusedZone !== 'overview' && (
        <button
          type="button"
          onClick={onResetCamera}
          data-testid="dock-reset-camera"
          aria-label={t.dockResetCameraAria}
          className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-full bg-white/12 px-2 py-1.5 text-[10.5px] font-semibold text-white ring-1 ring-inset ring-white/25 transition-all duration-300 ease-out hover:bg-white/20 active:scale-95 sm:px-2.5 sm:py-2 sm:text-[11px]"
        >
          <RotateCcw className="h-3.5 w-3.5 text-cyan-300" />
          <span className="hidden sm:inline">{t.dockResetCamera}</span>
        </button>
      )}
    </nav>
  );
}
