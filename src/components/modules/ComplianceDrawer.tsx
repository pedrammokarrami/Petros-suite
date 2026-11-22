import {
  AlertOctagon,
  CheckCircle2,
  Crosshair,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import {
  UI_TRANSLATIONS,
  formatLocaleDigits,
  formatPercent,
} from '../../i18n/translations';
import type { ComplianceClause, ZoneFocusId } from '../../platform/types';
import type { Locale } from '../../i18n/types';

interface ComplianceDrawerProps {
  locale: Locale;
  isSoftwareGl: boolean;
  clauses: ComplianceClause[];
  onApplyCapa: (clauseId: string) => void;
  onFocusZone: (zone: ZoneFocusId) => void;
  onClose: () => void;
}

export function ComplianceDrawer({
  locale,
  isSoftwareGl,
  clauses,
  onApplyCapa,
  onFocusZone,
  onClose,
}: ComplianceDrawerProps) {
  const t = UI_TRANSLATIONS[locale];
  const isRtl = locale === 'fa';

  const compliantCount = clauses.filter((c) => c.status !== 'nonconformity').length;
  const openNcCount = clauses.length - compliantCount;
  const compliancePercent = Math.round((compliantCount / clauses.length) * 100);

  const modalSurface = isSoftwareGl
    ? 'bg-slate-950/94 ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.75)]'
    : 'bg-slate-950/74 backdrop-blur-3xl ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.7)]';

  return (
    <section
      data-testid="drawer-compliance"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`pointer-events-auto flex max-h-[84vh] w-full max-w-[740px] flex-col overflow-hidden rounded-[28px] text-slate-100 ${modalSurface}`}
    >
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 ring-1 ring-inset ring-amber-400/35">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-white">
              {t.compliance.title}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-300/80">
              {t.compliance.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.compliance.closeAria}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-slate-200 ring-1 ring-inset ring-white/15 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Compliance KPI Summary */}
      <div className="grid grid-cols-2 gap-3 border-b border-white/10 bg-white/[0.03] px-6 py-3">
        <div className="rounded-2xl bg-white/[0.05] px-4 py-2.5 ring-1 ring-inset ring-white/12">
          <span className="block text-[11px] text-slate-400">
            {t.compliance.complianceRate}
          </span>
          <span
            data-testid="compliance-percent"
            className="mt-0.5 block text-lg font-extrabold tabular-nums text-emerald-300"
          >
            {formatPercent(compliancePercent, locale)}
          </span>
        </div>
        <div className="rounded-2xl bg-white/[0.05] px-4 py-2.5 ring-1 ring-inset ring-white/12">
          <span className="block text-[11px] text-slate-400">
            {t.compliance.openNonconformities}
          </span>
          <span
            data-testid="open-nc-count"
            className={`mt-0.5 block text-lg font-extrabold tabular-nums ${
              openNcCount > 0 ? 'text-rose-300' : 'text-emerald-300'
            }`}
          >
            {formatLocaleDigits(openNcCount, locale)}
          </span>
        </div>
      </div>

      {/* ISO / EFQM Checklist */}
      <div className="flex-1 space-y-3 overflow-y-auto px-6 py-4">
        {clauses.map((clause) => {
          const isNc = clause.status === 'nonconformity';
          const isResolved = clause.status === 'resolved';

          return (
            <article
              key={clause.id}
              data-testid={`clause-${clause.id}`}
              className={`rounded-2xl p-4 ring-1 ring-inset ${
                isNc
                  ? 'bg-rose-500/[0.08] ring-rose-400/30'
                  : isResolved
                    ? 'bg-emerald-500/[0.08] ring-emerald-400/30'
                    : 'bg-white/[0.04] ring-white/12'
              }`}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10.5px] font-bold text-sky-200 ring-1 ring-inset ring-white/15">
                      {clause.standard}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-300">
                      {clause.clauseCode}
                    </span>
                  </div>
                  <h3 className="mt-1.5 text-[13px] font-bold text-white">
                    {clause.title}
                  </h3>
                </div>

                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10.5px] font-bold ring-1 ring-inset ${
                    isNc
                      ? 'bg-rose-500/20 text-rose-200 ring-rose-400/40'
                      : isResolved
                        ? 'bg-emerald-500/20 text-emerald-200 ring-emerald-400/40'
                        : 'bg-sky-500/18 text-sky-200 ring-sky-400/35'
                  }`}
                >
                  {isNc ? (
                    <>
                      <AlertOctagon className="h-3.5 w-3.5" />
                      <span>{t.compliance.statusNonconformity}</span>
                    </>
                  ) : isResolved ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{t.compliance.statusResolved}</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{t.compliance.statusCompliant}</span>
                    </>
                  )}
                </span>
              </div>

              <p className="mt-2 text-[12px] leading-relaxed text-slate-300">
                {clause.finding}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => onFocusZone(clause.linkedZone)}
                  className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.06] px-3 py-1 text-[11px] font-medium text-sky-200 ring-1 ring-inset ring-white/12 transition-all hover:bg-white/[0.14] active:scale-95"
                >
                  <Crosshair className="h-3.5 w-3.5" />
                  <span>{t.compliance.inspectZoneLink}</span>
                </button>

                {isNc && (
                  <button
                    type="button"
                    onClick={() => onApplyCapa(clause.id)}
                    data-testid={`btn-capa-${clause.id}`}
                    className="flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-500 px-3.5 py-1.5 text-[11.5px] font-bold text-slate-950 shadow-[0_8px_20px_rgba(16,185,129,0.3)] transition-all hover:bg-emerald-400 active:scale-95"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{t.compliance.applyCapaButton}</span>
                  </button>
                )}
              </div>

              {/* AI-Generated CAPA Plan */}
              {isResolved && clause.capa && (
                <div
                  data-testid={`capa-plan-${clause.id}`}
                  className="mt-3 space-y-1.5 rounded-xl bg-slate-950/65 p-3 text-[11.5px] ring-1 ring-inset ring-emerald-400/30"
                >
                  <div className="font-bold text-emerald-300">
                    {t.compliance.capaExecutedTitle}
                  </div>
                  <p className="text-slate-300">
                    <span className="font-semibold text-white">
                      {t.compliance.rootCauseLabel}{' '}
                    </span>
                    {clause.capa.rootCause}
                  </p>
                  <p className="text-slate-200">
                    <span className="font-semibold text-emerald-300">
                      {t.compliance.correctiveActionLabel}{' '}
                    </span>
                    {clause.capa.correctiveAction}
                  </p>
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[10.5px] text-slate-400">
                    <span>
                      {t.compliance.ownerLabel} {clause.capa.owner}
                    </span>
                    <span className="tabular-nums">
                      {t.compliance.deadlineLabel}{' '}
                      {formatLocaleDigits(clause.capa.targetDays, locale)}{' '}
                      {t.compliance.daysSuffix}
                    </span>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
