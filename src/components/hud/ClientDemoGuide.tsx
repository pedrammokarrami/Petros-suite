import {
  CheckCircle2,
  Compass,
  Play,
  Sparkles,
  X,
} from 'lucide-react';
import { UI_TRANSLATIONS } from '../../i18n/translations';
import type { Locale } from '../../i18n/types';
import type { PlatformModule } from '../../platform/types';
import type { SimMode } from '../../simulation/types';

export type DemoStepId = 'mode' | 'architecture' | 'document_ai' | 'maturity_capa';

interface ClientDemoGuideProps {
  locale: Locale;
  mode: SimMode;
  isSoftwareGl: boolean;
  completedSteps: Set<DemoStepId>;
  onMarkStep: (step: DemoStepId) => void;
  onModeChange: (mode: SimMode) => void;
  onSelectModule: (module: PlatformModule) => void;
  onClose: () => void;
}

/**
 * Subtle, dismissible Apple VisionOS spatial glass Client Demo Guide modal.
 * Highlights the 4 key client test flows with one-click launchers and bilingual FA/EN copy.
 */
export function ClientDemoGuide({
  locale,
  mode,
  isSoftwareGl,
  completedSteps,
  onMarkStep,
  onModeChange,
  onSelectModule,
  onClose,
}: ClientDemoGuideProps) {
  const t = UI_TRANSLATIONS[locale];
  const isRtl = locale === 'fa';

  const modalSurface = isSoftwareGl
    ? 'bg-slate-950/94 ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.75)]'
    : 'bg-slate-950/76 backdrop-blur-3xl ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.7)]';

  const handlePrimaryAction = (stepId: DemoStepId) => {
    onMarkStep(stepId);
    if (stepId === 'mode') {
      onModeChange(mode === 'AS_IS' ? 'TO_BE' : 'AS_IS');
      onClose();
    } else if (stepId === 'architecture') {
      onClose();
      onSelectModule('architecture');
    } else if (stepId === 'document_ai') {
      onClose();
      onSelectModule('document_ai');
    } else {
      onClose();
      onSelectModule('profile_360');
    }
  };

  const handleSecondaryAction = () => {
    onMarkStep('maturity_capa');
    onClose();
    onSelectModule('compliance');
  };

  return (
    <section
      data-testid="modal-demo-guide"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`pointer-events-auto flex max-h-[84vh] w-full max-w-[660px] flex-col overflow-hidden rounded-[28px] text-slate-100 ${modalSurface}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-500/25 to-emerald-500/25 text-sky-200 ring-1 ring-inset ring-sky-400/40">
            <Compass className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-white">
              {t.demoGuide.title}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-300/80">
              {t.demoGuide.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.demoGuide.closeAria}
          data-testid="btn-close-demo-guide"
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-slate-200 ring-1 ring-inset ring-white/15 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* 4 Interactive Guided Steps */}
      <div className="flex-1 space-y-2.5 overflow-y-auto px-6 py-4">
        {t.demoGuide.steps.map((step) => {
          const isDone = completedSteps.has(step.id);
          return (
            <div
              key={step.id}
              data-testid={`demo-step-${step.id}`}
              className={`rounded-2xl p-4 ring-1 ring-inset transition-all ${
                isDone
                  ? 'bg-emerald-500/[0.08] ring-emerald-400/35'
                  : 'bg-white/[0.04] ring-white/12 hover:bg-white/[0.07]'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[12px] font-bold ring-1 ring-inset ${
                    isDone
                      ? 'bg-emerald-500/25 text-emerald-200 ring-emerald-400/45'
                      : 'bg-sky-500/20 text-sky-200 ring-sky-400/40'
                  }`}
                >
                  {isDone ? <CheckCircle2 className="h-4 w-4" /> : step.number}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-[13px] font-bold text-white">
                      {step.title}
                    </h3>
                    {isDone && (
                      <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-semibold text-emerald-200 ring-1 ring-inset ring-emerald-400/35">
                        {t.demoGuide.doneLabel}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-slate-300">
                    {step.description}
                  </p>

                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handlePrimaryAction(step.id)}
                      data-testid={`btn-demo-action-${step.id}`}
                      className="flex cursor-pointer items-center gap-1.5 rounded-full bg-sky-500/22 px-3.5 py-1.5 text-[11.5px] font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/45 transition-all hover:bg-sky-500/32 active:scale-95"
                    >
                      <Play className="h-3 w-3" />
                      <span>{step.actionLabel}</span>
                    </button>

                    {step.secondaryActionLabel && (
                      <button
                        type="button"
                        onClick={handleSecondaryAction}
                        data-testid="btn-demo-action-compliance"
                        className="flex cursor-pointer items-center gap-1.5 rounded-full bg-emerald-500/20 px-3.5 py-1.5 text-[11.5px] font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-400/40 transition-all hover:bg-emerald-500/30 active:scale-95"
                      >
                        <Sparkles className="h-3 w-3" />
                        <span>{step.secondaryActionLabel}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end border-t border-white/10 bg-white/[0.02] px-6 py-3">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full bg-white/10 px-4 py-1.5 text-[12px] font-semibold text-slate-200 ring-1 ring-inset ring-white/15 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          {t.demoGuide.dismissButton}
        </button>
      </div>
    </section>
  );
}
