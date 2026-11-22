import { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  FileCheck2,
  HelpCircle,
  Link2,
  Search,
} from 'lucide-react';
import {
  ANNEX_SL_CHAPTERS,
  DOCUMENT_LAYERS,
  ISO_KNOWLEDGE_BASE,
  ISO_STANDARDS,
  ISO_STANDARD_LIST,
} from '../../../data/isoKnowledgeBase';
import { toPersianDigits } from '../../../simulation/engine';
import { computeImsReadiness, makeEvaluationKey } from '../calculations';
import type {
  ComplianceStatus,
  GapEvaluation,
  IsoStandardCode,
} from '../types';

interface ImsDashboardGapProps {
  evaluations: Record<string, GapEvaluation>;
  openCapaCount: number;
  onUpdateEvaluation: (
    clauseNumber: string,
    standard: IsoStandardCode,
    patch: Partial<Pick<GapEvaluation, 'status' | 'notes' | 'evidenceLink'>>
  ) => void;
  onJumpToCapa: () => void;
}

const STATUS_OPTIONS: Array<{
  value: ComplianceStatus;
  label: string;
  shortLabel: string;
  textClass: string;
}> = [
  {
    value: 'compliant',
    label: 'منطبق (Compliant)',
    shortLabel: 'منطبق',
    textClass: 'text-emerald-300',
  },
  {
    value: 'in_progress',
    label: 'در دست اقدام (In Progress)',
    shortLabel: 'در دست اقدام',
    textClass: 'text-sky-300',
  },
  {
    value: 'minor_nc',
    label: 'عدم انطباق جزئی (Minor NC)',
    shortLabel: 'عدم انطباق جزئی',
    textClass: 'text-amber-300',
  },
  {
    value: 'major_nc',
    label: 'عدم انطباق کلی (Major NC)',
    shortLabel: 'عدم انطباق کلی',
    textClass: 'text-rose-300',
  },
  {
    value: 'na',
    label: 'غیرقابل انطباق (N/A)',
    shortLabel: 'N/A',
    textClass: 'text-slate-400',
  },
];

function ReadinessRadarChart({
  scores,
  overallPct,
}: {
  scores: Record<IsoStandardCode, number>;
  overallPct: number;
}) {
  const cx = 140;
  const cy = 122;
  const maxR = 76;
  const axes: Array<{ std: IsoStandardCode; angleDeg: number; label: string }> = [
    { std: '14001', angleDeg: -90, label: 'ISO 14001' },
    { std: '45001', angleDeg: 0, label: 'ISO 45001' },
    { std: '50001', angleDeg: 90, label: 'ISO 50001' },
    { std: '55001', angleDeg: 180, label: 'ISO 55001' },
  ];

  const polar = (angleDeg: number, radius: number) => {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + Math.cos(rad) * radius,
      y: cy + Math.sin(rad) * radius,
    };
  };

  const ringLevels = [25, 50, 75, 100];
  const dataPoints = axes.map((a) => {
    const pct = Math.max(4, Math.min(100, scores[a.std] ?? 0));
    return polar(a.angleDeg, (pct / 100) * maxR);
  });
  const polygonStr = dataPoints.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <div dir="ltr" className="flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 280 252"
        className="h-[228px] w-[264px] overflow-visible"
        role="img"
        aria-label={`نمودار رادار آمادگی سیستم مدیریت یکپارچه: ${overallPct} درصد`}
      >
        {/* Concentric diamond rings */}
        {ringLevels.map((lvl) => {
          const pts = axes
            .map((a) => {
              const pt = polar(a.angleDeg, (lvl / 100) * maxR);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');
          return (
            <polygon
              key={lvl}
              points={pts}
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth={lvl === 100 ? 1.25 : 0.8}
              strokeDasharray={lvl === 100 ? undefined : '3 3'}
            />
          );
        })}

        {/* Axis lines */}
        {axes.map((a) => {
          const end = polar(a.angleDeg, maxR);
          return (
            <line
              key={a.std}
              x1={cx}
              y1={cy}
              x2={end.x}
              y2={end.y}
              stroke="rgba(255,255,255,0.16)"
              strokeWidth={1}
            />
          );
        })}

        {/* Active readiness polygon */}
        <polygon
          points={polygonStr}
          fill="rgba(56, 189, 248, 0.22)"
          stroke="#38bdf8"
          strokeWidth={2}
        />

        {/* Vertex dots */}
        {dataPoints.map((pt, idx) => (
          <circle
            key={axes[idx].std}
            cx={pt.x}
            cy={pt.y}
            r={4.2}
            fill={ISO_STANDARDS[axes[idx].std].strokeColor}
            stroke="#0b1120"
            strokeWidth={1.5}
          />
        ))}

        {/* Axis Labels */}
        {axes.map((a) => {
          const lp = polar(a.angleDeg, maxR + 22);
          const anchor =
            a.angleDeg === 0 ? 'start' : a.angleDeg === 180 ? 'end' : 'middle';
          const dy = a.angleDeg === -90 ? -4 : a.angleDeg === 90 ? 12 : 4;
          return (
            <g key={`lbl-${a.std}`}>
              <text
                x={lp.x}
                y={lp.y + dy}
                textAnchor={anchor}
                fill="#e2e8f0"
                fontSize="10.5"
                fontWeight="600"
                direction="ltr"
              >
                {a.label}
              </text>
              <text
                x={lp.x}
                y={lp.y + dy + 13}
                textAnchor={anchor}
                fill={ISO_STANDARDS[a.std].strokeColor}
                fontSize="10"
                fontWeight="700"
              >
                {toPersianDigits(scores[a.std])}٪
              </text>
            </g>
          );
        })}

        {/* Center overall readiness metric */}
        <text
          x={cx}
          y={cy - 2}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="18"
          fontWeight="700"
        >
          {toPersianDigits(overallPct)}٪
        </text>
        <text
          x={cx}
          y={cy + 14}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="9.5"
          fontWeight="500"
        >
          آمادگی کل IMS
        </text>
      </svg>
    </div>
  );
}

export function ImsDashboardGap({
  evaluations,
  openCapaCount,
  onUpdateEvaluation,
  onJumpToCapa,
}: ImsDashboardGapProps) {
  // Multi-select standard filter (empty array or all 4 = All IMS)
  const [selectedStandards, setSelectedStandards] = useState<IsoStandardCode[]>(
    [...ISO_STANDARD_LIST]
  );
  const [chapterFilter, setChapterFilter] = useState<number | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<ComplianceStatus | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [expandedClause, setExpandedClause] = useState<string>('6.1');

  const readiness = useMemo(() => computeImsReadiness(evaluations), [evaluations]);
  const isAllSelected = selectedStandards.length === ISO_STANDARD_LIST.length;

  const toggleStandard = (std: IsoStandardCode) => {
    setSelectedStandards((prev) => {
      if (prev.length === ISO_STANDARD_LIST.length) {
        return [std];
      }
      if (prev.includes(std)) {
        const next = prev.filter((s) => s !== std);
        return next.length === 0 ? [...ISO_STANDARD_LIST] : next;
      }
      return [...prev, std];
    });
  };

  const selectAllStandards = () => {
    setSelectedStandards([...ISO_STANDARD_LIST]);
  };

  const filteredClauses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return ISO_KNOWLEDGE_BASE.filter((clause) => {
      if (chapterFilter !== 'all' && clause.parentClause !== chapterFilter) {
        return false;
      }
      const matchesStatus =
        statusFilter === 'all' ||
        selectedStandards.some((std) => {
          const ev = evaluations[makeEvaluationKey(clause.clauseNumber, std)];
          return (ev?.status ?? 'in_progress') === statusFilter;
        });
      if (!matchesStatus) return false;

      if (!q) return true;
      if (
        clause.clauseNumber.includes(q) ||
        clause.title.toLowerCase().includes(q) ||
        clause.commonSummary.toLowerCase().includes(q)
      ) {
        return true;
      }
      return selectedStandards.some((std) => {
        const d = clause.standards[std];
        return (
          d.focusTitle.toLowerCase().includes(q) ||
          d.requirementSummary.toLowerCase().includes(q)
        );
      });
    });
  }, [chapterFilter, evaluations, searchQuery, selectedStandards, statusFilter]);

  const radarScores: Record<IsoStandardCode, number> = {
    '14001': readiness.byStandard['14001'].readinessPct,
    '45001': readiness.byStandard['45001'].readinessPct,
    '50001': readiness.byStandard['50001'].readinessPct,
    '55001': readiness.byStandard['55001'].readinessPct,
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Band: Radar Chart + 4 Standard Readiness Bars */}
      <section className="grid grid-cols-1 gap-6 border-b border-white/10 pb-6 lg:grid-cols-12">
        {/* Radar Visualization */}
        <div className="flex flex-col items-center justify-center rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10 lg:col-span-4">
          <ReadinessRadarChart
            scores={radarScores}
            overallPct={readiness.overallPct}
          />
          <div className="mt-1 flex items-center gap-3 text-[11.5px] text-slate-300 tabular-nums">
            <span>
              منطبق:{' '}
              <strong className="text-emerald-300">
                {toPersianDigits(readiness.totalCompliant)}
              </strong>{' '}
              از {toPersianDigits(readiness.totalApplicable)}
            </span>
            <span aria-hidden="true" className="text-white/25">
              ·
            </span>
            <button
              type="button"
              onClick={onJumpToCapa}
              className="cursor-pointer font-semibold text-amber-300 underline decoration-amber-300/40 underline-offset-4 transition-colors hover:text-amber-200"
            >
              {toPersianDigits(openCapaCount)} اقدام CAPA باز
            </button>
          </div>
        </div>

        {/* 4 ISO Standards Live Readiness Bars */}
        <div className="flex flex-col justify-between gap-4 lg:col-span-8">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <h2 className="text-[16px] font-bold text-white">
                وضعیت آمادگی ممیزی بر مبنای ساختار یکپارچه (Annex SL)
              </h2>
              <p className="mt-0.5 text-[12px] text-slate-400">
                بندهای ۴ تا ۱۰ استانداردهای چهارگانه — تغییر وضعیت به عدم انطباق، به‌صورت خودکار اقدام اصلاحی (CAPA) ایجاد می‌کند
              </p>
            </div>
            <div className="flex items-center gap-3 text-[12px] text-slate-300 tabular-nums">
              <span>
                عدم انطباق کلی:{' '}
                <strong className="text-rose-300">
                  {toPersianDigits(readiness.totalMajorNc)}
                </strong>
              </span>
              <span aria-hidden="true" className="text-white/20">
                ·
              </span>
              <span>
                عدم انطباق جزئی:{' '}
                <strong className="text-amber-300">
                  {toPersianDigits(readiness.totalMinorNc)}
                </strong>
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ISO_STANDARD_LIST.map((std) => {
              const meta = ISO_STANDARDS[std];
              const stat = readiness.byStandard[std];
              const isActive = selectedStandards.includes(std);
              return (
                <button
                  key={std}
                  type="button"
                  onClick={() => toggleStandard(std)}
                  className={`flex cursor-pointer flex-col gap-2 rounded-2xl p-3.5 text-right transition-all duration-200 ${
                    isActive
                      ? 'bg-white/[0.06] ring-1 ring-inset ring-white/20 hover:bg-white/[0.09]'
                      : 'bg-white/[0.02] opacity-55 ring-1 ring-inset ring-white/10 hover:opacity-85'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <span className={`text-[13px] font-bold ${meta.accentClass}`} dir="ltr">
                        {meta.shortLabel}
                      </span>
                      <span className="mx-1.5 text-white/25" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-[12px] font-medium text-slate-200">
                        {meta.persianName}
                      </span>
                    </div>
                    <span className="text-[15px] font-bold text-white tabular-nums">
                      {toPersianDigits(stat.readinessPct)}٪
                    </span>
                  </div>

                  {/* Clean horizontal readiness meter */}
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{
                        width: `${stat.readinessPct}%`,
                        backgroundColor: meta.strokeColor,
                      }}
                    />
                  </div>

                  <div className="flex items-center gap-2.5 text-[11px] text-slate-400 tabular-nums">
                    <span>منطبق: {toPersianDigits(stat.compliantCount)}</span>
                    <span aria-hidden="true">·</span>
                    <span>در اقدام: {toPersianDigits(stat.inProgressCount)}</span>
                    <span aria-hidden="true">·</span>
                    <span className={stat.majorNcCount + stat.minorNcCount > 0 ? 'text-amber-300' : ''}>
                      NC: {toPersianDigits(stat.minorNcCount + stat.majorNcCount)}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Interactive Filter Toolbar */}
      <section className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        {/* Standard Filter Controls (single-row, zero orphan wrap) */}
        <div
          role="group"
          aria-label="فیلتر استانداردهای ایزو"
          className="flex shrink-0 items-center gap-1 overflow-x-auto rounded-xl bg-white/[0.05] p-1 ring-1 ring-inset ring-white/12"
        >
          <button
            type="button"
            onClick={selectAllStandards}
            aria-pressed={isAllSelected}
            data-testid="ims-filter-all"
            className={`cursor-pointer whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
              isAllSelected
                ? 'bg-white/20 text-white'
                : 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
            }`}
          >
            همه (IMS)
          </button>
          {ISO_STANDARD_LIST.map((std) => {
            const active = !isAllSelected && selectedStandards.includes(std);
            return (
              <button
                key={std}
                type="button"
                onClick={() => toggleStandard(std)}
                aria-pressed={selectedStandards.includes(std)}
                data-testid={`ims-filter-${std}`}
                className={`cursor-pointer whitespace-nowrap rounded-lg px-2.5 py-1.5 text-[11.5px] font-semibold transition-colors ${
                  active
                    ? 'bg-white/20 text-white'
                    : isAllSelected
                      ? 'text-slate-300 hover:bg-white/[0.08] hover:text-white'
                      : 'text-slate-400 hover:bg-white/[0.08] hover:text-slate-200'
                }`}
                dir="ltr"
              >
                ISO {std}
              </button>
            );
          })}
        </div>

        {/* Search + Chapter + Status Dropdowns (single-row on desktop) */}
        <div className="flex flex-wrap items-center gap-2 xl:flex-nowrap">
          <div className="relative min-w-[175px] flex-1 xl:w-[195px] xl:flex-initial">
            <Search className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="جستجو در بندها..."
              aria-label="جستجو در بندهای استاندارد"
              className="w-full rounded-xl bg-white/[0.05] py-1.5 pr-8 pl-3 text-[12px] text-white placeholder-slate-400 ring-1 ring-inset ring-white/15 focus:outline-none focus:ring-sky-400/60"
            />
          </div>

          <select
            aria-label="فیلتر فصل Annex SL"
            value={chapterFilter}
            onChange={(e) =>
              setChapterFilter(e.target.value === 'all' ? 'all' : Number(e.target.value))
            }
            className="cursor-pointer rounded-xl bg-slate-900/90 px-2.5 py-1.5 text-[11.5px] text-slate-200 ring-1 ring-inset ring-white/15 focus:outline-none focus:ring-sky-400/60"
          >
            <option value="all">همه بندها (۴ تا ۱۰)</option>
            {[4, 5, 6, 7, 8, 9, 10].map((ch) => (
              <option key={ch} value={ch}>
                {ANNEX_SL_CHAPTERS[ch]}
              </option>
            ))}
          </select>

          <select
            aria-label="فیلتر وضعیت انطباق"
            value={statusFilter}
            onChange={(e) =>
              setStatusFilter(e.target.value as ComplianceStatus | 'all')
            }
            className="cursor-pointer rounded-xl bg-slate-900/90 px-2.5 py-1.5 text-[11.5px] text-slate-200 ring-1 ring-inset ring-white/15 focus:outline-none focus:ring-sky-400/60"
          >
            <option value="all">همه وضعیت‌ها</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      {/* Annex SL Interactive Gap Analysis Matrix */}
      <section className="divide-y divide-white/10 rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/10">
        {filteredClauses.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-400">
            هیچ بندی با فیلترهای انتخابی مطابقت ندارد. فیلترها را بازنشانی کنید.
          </div>
        ) : (
          filteredClauses.map((clause) => {
            const isOpen = expandedClause === clause.clauseNumber;
            const visibleStds = selectedStandards;
            const ncCount = visibleStds.filter((s) => {
              const st = evaluations[makeEvaluationKey(clause.clauseNumber, s)]?.status;
              return st === 'minor_nc' || st === 'major_nc';
            }).length;

            return (
              <div key={clause.clauseNumber} className="transition-colors">
                <button
                  type="button"
                  onClick={() =>
                    setExpandedClause(isOpen ? '' : clause.clauseNumber)
                  }
                  aria-expanded={isOpen}
                  data-testid={`clause-toggle-${clause.clauseNumber}`}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-4 py-3.5 text-right transition-colors hover:bg-white/[0.04]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                      <span className="font-mono text-[13px] font-bold text-sky-300 tabular-nums">
                        بند {toPersianDigits(clause.clauseNumber)}
                      </span>
                      <span className="text-[14px] font-semibold text-white">
                        {clause.title}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-[12px] text-slate-400">
                      {clause.commonSummary}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3 text-[11.5px] tabular-nums">
                    <span className="hidden text-slate-400 sm:inline">
                      {toPersianDigits(visibleStds.length)} استاندارد
                    </span>
                    {ncCount > 0 && (
                      <span className="font-semibold text-amber-300">
                        {toPersianDigits(ncCount)} عدم انطباق
                      </span>
                    )}
                    {isOpen ? (
                      <ChevronUp className="h-4 w-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-slate-400" />
                    )}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-white/10 bg-slate-950/40 px-4 py-4">
                    <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                      {visibleStds.map((std) => {
                        const detail = clause.standards[std];
                        const meta = ISO_STANDARDS[std];
                        const key = makeEvaluationKey(clause.clauseNumber, std);
                        const ev = evaluations[key] ?? {
                          key,
                          clauseNumber: clause.clauseNumber,
                          standard: std,
                          status: 'in_progress' as ComplianceStatus,
                          notes: '',
                          evidenceLink: '',
                          updatedAt: '',
                        };
                        const statusObj = STATUS_OPTIONS.find(
                          (o) => o.value === ev.status
                        );

                        return (
                          <div
                            key={key}
                            className="flex flex-col gap-3 rounded-xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10"
                          >
                            {/* Header line: Standard + Focus Title + Status Dropdown */}
                            <div className="flex flex-wrap items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-slate-400">
                                  <span
                                    className={`font-bold ${meta.accentClass}`}
                                    dir="ltr"
                                  >
                                    {meta.shortLabel}
                                  </span>
                                  <span aria-hidden="true">·</span>
                                  <span>{meta.persianName}</span>
                                  {detail.mandatoryDocumentedInfo && (
                                    <>
                                      <span aria-hidden="true">·</span>
                                      <span className="inline-flex items-center gap-1 text-sky-300">
                                        <FileCheck2 className="h-3 w-3" />
                                        اطلاعات مدون الزامی (
                                        {detail.documentCategory
                                          ? DOCUMENT_LAYERS[detail.documentCategory].title
                                          : 'سند'}
                                        )
                                      </span>
                                    </>
                                  )}
                                </div>
                                <h4 className="mt-1 text-[13px] font-semibold text-white">
                                  {detail.focusTitle}
                                </h4>
                              </div>

                              <select
                                aria-label={`وضعیت انطباق بند ${clause.clauseNumber} استاندارد ${std}`}
                                data-testid={`gap-status-${clause.clauseNumber}-${std}`}
                                value={ev.status}
                                onChange={(e) =>
                                  onUpdateEvaluation(clause.clauseNumber, std, {
                                    status: e.target.value as ComplianceStatus,
                                  })
                                }
                                className={`cursor-pointer rounded-lg bg-slate-900/95 px-2.5 py-1.5 text-[11.5px] font-semibold ring-1 ring-inset ring-white/20 focus:outline-none focus:ring-sky-400 ${
                                  statusObj?.textClass ?? 'text-white'
                                }`}
                              >
                                {STATUS_OPTIONS.map((opt) => (
                                  <option
                                    key={opt.value}
                                    value={opt.value}
                                    className="bg-slate-900 text-slate-100"
                                  >
                                    {opt.label}
                                  </option>
                                ))}
                              </select>
                            </div>

                            <p className="text-[12px] leading-relaxed text-slate-300">
                              {detail.requirementSummary}
                            </p>

                            {/* External Audit Readiness Questions */}
                            <div className="border-t border-white/10 pt-2.5">
                              <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-slate-300">
                                <HelpCircle className="h-3.5 w-3.5 text-sky-300" />
                                <span>سؤالات کلیدی ممیزی خارجی (Audit Readiness)</span>
                              </div>
                              <ul className="space-y-1 text-[11.5px] leading-relaxed text-slate-400">
                                {detail.auditQuestions.map((q, idx) => (
                                  <li key={idx} className="flex gap-1.5">
                                    <span className="font-mono text-slate-500">
                                      {toPersianDigits(idx + 1)}.
                                    </span>
                                    <span>{q}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>

                            {/* Notes & Evidence Link */}
                            <div className="grid grid-cols-1 gap-2 border-t border-white/10 pt-2.5 sm:grid-cols-2">
                              <input
                                type="text"
                                value={ev.notes}
                                onChange={(e) =>
                                  onUpdateEvaluation(clause.clauseNumber, std, {
                                    notes: e.target.value,
                                  })
                                }
                                placeholder="یادداشت ارزیابی یا شرح شکاف..."
                                aria-label={`یادداشت بند ${clause.clauseNumber} استاندارد ${std}`}
                                className="rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-slate-100 placeholder-slate-500 ring-1 ring-inset ring-white/12 focus:outline-none focus:ring-sky-400/60"
                              />
                              <div className="relative">
                                <Link2 className="pointer-events-none absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                                <input
                                  type="text"
                                  value={ev.evidenceLink}
                                  onChange={(e) =>
                                    onUpdateEvaluation(clause.clauseNumber, std, {
                                      evidenceLink: e.target.value,
                                    })
                                  }
                                  placeholder="کد سند یا لینک شاهد عینی (Evidence)..."
                                  aria-label={`شاهد عینی بند ${clause.clauseNumber} استاندارد ${std}`}
                                  dir="ltr"
                                  className="w-full rounded-lg bg-white/[0.04] py-1.5 pr-8 pl-2.5 text-[11.5px] text-slate-100 placeholder-slate-500 ring-1 ring-inset ring-white/12 focus:outline-none focus:ring-sky-400/60"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </section>
    </div>
  );
}
