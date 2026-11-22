import { useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Crosshair,
  GitBranch,
  Layers,
  X,
} from 'lucide-react';
import {
  ARCHITECTURE_TREE_BY_LOCALE,
  UI_TRANSLATIONS,
} from '../../i18n/translations';
import type { ProcessArchNode, ZoneFocusId } from '../../platform/types';
import type { SimMode } from '../../simulation/types';
import type { Locale } from '../../i18n/types';

interface ArchitectureDrawerProps {
  mode: SimMode;
  locale: Locale;
  isSoftwareGl: boolean;
  activeNodeId: string;
  focusedZone: ZoneFocusId;
  onSelectNode: (node: ProcessArchNode) => void;
  onClose: () => void;
}

const LEVEL_STYLES: Record<0 | 1 | 2 | 3, string> = {
  0: 'bg-sky-500/20 text-sky-200 ring-sky-400/35',
  1: 'bg-indigo-500/20 text-indigo-200 ring-indigo-400/35',
  2: 'bg-cyan-500/20 text-cyan-200 ring-cyan-400/35',
  3: 'bg-slate-400/15 text-slate-200 ring-white/20',
};

export function ArchitectureDrawer({
  mode,
  locale,
  isSoftwareGl,
  activeNodeId,
  focusedZone,
  onSelectNode,
  onClose,
}: ArchitectureDrawerProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    () => new Set(['l0-value-chain', 'l1-supply', 'l2-procurement'])
  );

  const t = UI_TRANSLATIONS[locale];
  const isRtl = locale === 'fa';
  const tree = ARCHITECTURE_TREE_BY_LOCALE[locale];

  const toggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const modalSurface = isSoftwareGl
    ? 'bg-slate-950/94 ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.75)]'
    : 'bg-slate-950/74 backdrop-blur-3xl ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.7)]';

  const renderNode = (node: ProcessArchNode, depth: number) => {
    const hasChildren = Boolean(node.children && node.children.length > 0);
    const isExpanded = expandedIds.has(node.id);
    const isActive = activeNodeId === node.id;

    const statusKind =
      mode === 'TO_BE' && node.status === 'bottleneck'
        ? 'optimized'
        : node.status;

    const statusBadge =
      statusKind === 'bottleneck'
        ? {
            label: t.architecture.statusBottleneck,
            cls: 'bg-amber-500/20 text-amber-200 ring-amber-400/35',
          }
        : statusKind === 'optimized'
          ? {
              label: t.architecture.statusOptimized,
              cls: 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/35',
            }
          : {
              label: t.architecture.statusHealthy,
              cls: 'bg-white/10 text-slate-200 ring-white/15',
            };

    const CollapsedIcon = isRtl ? ChevronLeft : ChevronRight;

    return (
      <div key={node.id} className="select-none">
        <div
          className={`group flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-all duration-200 ${
            isActive
              ? 'bg-sky-500/18 ring-1 ring-inset ring-sky-400/45 shadow-[0_8px_24px_rgba(14,165,233,0.18)]'
              : 'bg-white/[0.03] ring-1 ring-inset ring-white/[0.06] hover:bg-white/[0.08]'
          }`}
          style={
            isRtl
              ? { marginRight: `${depth * 14}px` }
              : { marginLeft: `${depth * 14}px` }
          }
        >
          {hasChildren ? (
            <button
              type="button"
              onClick={() => toggleExpand(node.id)}
              aria-label={isExpanded ? 'Collapse' : 'Expand'}
              className="flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full text-slate-300 transition-all hover:bg-white/15 hover:text-white active:scale-95"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <CollapsedIcon className="h-4 w-4" />
              )}
            </button>
          ) : (
            <span className="flex h-7 w-7 shrink-0 items-center justify-center text-slate-500">
              <GitBranch className="h-3.5 w-3.5" />
            </span>
          )}

          <button
            type="button"
            onClick={() => onSelectNode(node)}
            data-testid={`arch-node-${node.id}`}
            className={`flex min-w-0 flex-1 cursor-pointer items-center justify-between gap-3 ${
              isRtl ? 'text-right' : 'text-left'
            }`}
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${LEVEL_STYLES[node.level]}`}
                >
                  {isRtl
                    ? `سطح ${['۰', '۱', '۲', '۳'][node.level]}`
                    : `L${node.level}`}
                </span>
                <span className="truncate text-[13px] font-semibold text-white">
                  {node.title}
                </span>
              </div>
              <p className="mt-0.5 truncate text-[11px] text-slate-400">
                {node.owner} • {node.code}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ring-1 ring-inset ${statusBadge.cls}`}
              >
                {statusBadge.label}
              </span>
              <Crosshair
                className={`h-4 w-4 transition-colors ${
                  isActive
                    ? 'text-sky-300'
                    : 'text-slate-500 group-hover:text-sky-300'
                }`}
              />
            </div>
          </button>
        </div>

        {hasChildren && isExpanded && (
          <div className="mt-1.5 space-y-1.5">
            {node.children!.map((child) => renderNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <section
      data-testid="drawer-architecture"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`pointer-events-auto flex max-h-[82vh] w-full max-w-[680px] flex-col overflow-hidden rounded-[28px] text-slate-100 ${modalSurface}`}
    >
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-sky-500/20 text-sky-300 ring-1 ring-inset ring-sky-400/35">
            <Layers className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-white">
              {t.architecture.title}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-300/80">
              {t.architecture.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.architecture.closeAria}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-slate-200 ring-1 ring-inset ring-white/15 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Camera Focus Pill Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 bg-white/[0.03] px-6 py-2.5 text-[12px]">
        <div className="flex items-center gap-2">
          <Crosshair className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-slate-400">{t.architecture.currentFocus}</span>
          <span className="font-semibold text-sky-200">
            {t.zones[focusedZone]}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full bg-sky-500/20 px-3 py-1 text-[11px] font-semibold text-sky-200 ring-1 ring-inset ring-sky-400/40 transition-all hover:bg-sky-500/30 active:scale-95"
        >
          {t.architecture.viewIn3d}
        </button>
      </div>

      {/* Expandable L0–L3 Tree */}
      <div className="flex-1 space-y-2 overflow-y-auto px-6 py-4">
        {tree.map((rootNode) => renderNode(rootNode, 0))}
      </div>
    </section>
  );
}
