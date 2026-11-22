import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  FileText,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { analyzeRegulationDocument } from '../../platform/analyzer';
import {
  SAMPLE_REGULATIONS_BY_LOCALE,
  UI_TRANSLATIONS,
  formatLocaleDigits,
} from '../../i18n/translations';
import type { DocumentAnalysisResult } from '../../platform/types';
import type { Locale } from '../../i18n/types';

interface DocumentAiDrawerProps {
  locale: Locale;
  isSoftwareGl: boolean;
  latestAnalysis: DocumentAnalysisResult | null;
  onApplyAnalysis: (result: DocumentAnalysisResult) => void;
  onClose: () => void;
}

export function DocumentAiDrawer({
  locale,
  isSoftwareGl,
  latestAnalysis,
  onApplyAnalysis,
  onClose,
}: DocumentAiDrawerProps) {
  const t = UI_TRANSLATIONS[locale];
  const isRtl = locale === 'fa';
  const samples = SAMPLE_REGULATIONS_BY_LOCALE[locale];

  const [text, setText] = useState<string>(samples[0].text);
  const [selectedSampleId, setSelectedSampleId] = useState<string>(samples[0].id);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanStepIndex, setScanStepIndex] = useState<number>(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [appliedToast, setAppliedToast] = useState<boolean>(false);
  const timersRef = useRef<number[]>([]);

  // When switching language, keep sample text synced if a sample was selected
  useEffect(() => {
    const matched = samples.find((s) => s.id === selectedSampleId) ?? samples[0];
    setText(matched.text);
    setErrorMsg(null);
  }, [locale, samples, selectedSampleId]);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handleFileUpload = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const content = typeof reader.result === 'string' ? reader.result : '';
      if (content.trim()) {
        setText(content);
        setErrorMsg(null);
      }
    };
    reader.readAsText(file);
  };

  const handleAnalyze = () => {
    setErrorMsg(null);
    setAppliedToast(false);

    let parsed: DocumentAnalysisResult;
    try {
      parsed = analyzeRegulationDocument(text, locale);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Analysis failed.');
      return;
    }

    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setIsScanning(true);
    setScanStepIndex(0);

    const stepDelay = isSoftwareGl ? 140 : 280;
    t.documentAi.scanSteps.forEach((_, idx) => {
      const id = window.setTimeout(() => {
        setScanStepIndex(idx);
      }, idx * stepDelay);
      timersRef.current.push(id);
    });

    const finishId = window.setTimeout(() => {
      setIsScanning(false);
      onApplyAnalysis(parsed);
      setAppliedToast(true);
    }, t.documentAi.scanSteps.length * stepDelay + 120);
    timersRef.current.push(finishId);
  };

  const modalSurface = isSoftwareGl
    ? 'bg-slate-950/94 ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.75)]'
    : 'bg-slate-950/74 backdrop-blur-3xl ring-1 ring-inset ring-white/25 shadow-[0_32px_90px_rgba(0,0,0,0.7)]';

  const FlowArrow = isRtl ? ArrowLeft : ArrowRight;

  return (
    <section
      data-testid="drawer-document-ai"
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`pointer-events-auto flex max-h-[84vh] w-full max-w-[760px] flex-col overflow-hidden rounded-[28px] text-slate-100 ${modalSurface}`}
    >
      {/* Modal Header */}
      <div className="flex items-start justify-between gap-4 border-b border-white/10 px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300 ring-1 ring-inset ring-emerald-400/35">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-[15px] font-bold tracking-tight text-white">
              {t.documentAi.title}
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-300/80">
              {t.documentAi.subtitle}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t.documentAi.closeAria}
          className="flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-full bg-white/10 text-slate-200 ring-1 ring-inset ring-white/15 transition-all hover:bg-white/20 hover:text-white active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
        {/* Sample Regulation Chips */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[11px] font-medium text-slate-400">
            {t.documentAi.samplesLabel}
          </span>
          {samples.map((sample) => (
            <button
              key={sample.id}
              type="button"
              onClick={() => {
                setSelectedSampleId(sample.id);
                setText(sample.text);
                setErrorMsg(null);
              }}
              className={`cursor-pointer rounded-full px-3 py-1.5 text-[11px] font-medium transition-all active:scale-95 ${
                selectedSampleId === sample.id
                  ? 'bg-sky-500/25 text-sky-200 ring-1 ring-inset ring-sky-400/45'
                  : 'bg-white/[0.06] text-slate-200 ring-1 ring-inset ring-white/15 hover:bg-white/[0.12]'
              }`}
            >
              {sample.title}
            </button>
          ))}
        </div>

        {/* Upload / Paste Area */}
        <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/12">
          <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
            <label
              htmlFor="regulation-input"
              className="flex items-center gap-2 text-[12px] font-semibold text-slate-200"
            >
              <FileText className="h-4 w-4 text-sky-400" />
              {t.documentAi.inputLabel}
            </label>
            <label className="flex cursor-pointer items-center gap-1.5 rounded-full bg-white/[0.08] px-3 py-1 text-[11px] font-medium text-slate-200 ring-1 ring-inset ring-white/15 transition-all hover:bg-white/[0.15] active:scale-95">
              <Upload className="h-3.5 w-3.5" />
              <span>{t.documentAi.uploadLabel}</span>
              <input
                type="file"
                accept=".txt,.md,.csv"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files?.[0])}
              />
            </label>
          </div>
          <textarea
            id="regulation-input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder={t.documentAi.placeholder}
            className="w-full resize-none rounded-xl bg-slate-950/75 p-3 text-[12.5px] leading-relaxed text-slate-100 ring-1 ring-inset ring-white/12 placeholder:text-slate-500 focus:outline-none focus:ring-sky-400/60"
          />
          {errorMsg && (
            <p className="mt-2 text-[11.5px] font-medium text-rose-300">
              {errorMsg}
            </p>
          )}
          <button
            type="button"
            onClick={handleAnalyze}
            disabled={isScanning}
            data-testid="btn-run-doc-ai"
            className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-[13px] font-bold text-slate-950 shadow-[0_12px_30px_rgba(16,185,129,0.35)] transition-all duration-200 hover:bg-emerald-400 active:scale-[0.98] disabled:cursor-wait disabled:opacity-70"
          >
            <Sparkles className="h-4 w-4" />
            <span>
              {isScanning
                ? t.documentAi.analyzingButton
                : t.documentAi.analyzeButton}
            </span>
          </button>
        </div>

        {/* Live Step-by-Step AI Scan Progress */}
        {isScanning && (
          <div
            data-testid="doc-ai-scanning"
            className="space-y-2 rounded-2xl bg-emerald-500/10 p-4 ring-1 ring-inset ring-emerald-400/35"
          >
            {t.documentAi.scanSteps.map((step, idx) => {
              const done = idx < scanStepIndex;
              const active = idx === scanStepIndex;
              return (
                <div
                  key={step}
                  className={`flex items-center gap-2.5 text-[12px] ${
                    done
                      ? 'text-emerald-300'
                      : active
                        ? 'font-semibold text-white'
                        : 'text-slate-500'
                  }`}
                >
                  <CheckCircle2
                    className={`h-4 w-4 shrink-0 ${
                      done
                        ? 'text-emerald-400'
                        : active
                          ? 'text-cyan-300'
                          : 'text-slate-600'
                    }`}
                  />
                  <span>{step}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Extracted BPMN 2.0 Flow & RACI Matrix */}
        {latestAnalysis && !isScanning && (
          <div data-testid="doc-ai-results" className="space-y-4">
            {appliedToast && (
              <div className="flex items-center justify-between gap-2 rounded-2xl bg-emerald-500/15 px-4 py-2.5 text-[12px] text-emerald-200 ring-1 ring-inset ring-emerald-400/35">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                  <span>{t.documentAi.appliedBanner}</span>
                </div>
                <span className="shrink-0 font-bold text-emerald-300">
                  {latestAnalysis.estimatedTimeReduction}
                </span>
              </div>
            )}

            {/* BPMN 2.0 Diagram */}
            <div className="rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/12">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-[12.5px] font-bold text-white">
                  {t.documentAi.bpmnHeading}
                </h3>
                <span className="text-[11px] font-medium text-sky-300">
                  {latestAnalysis.processTitle}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {latestAnalysis.bpmnNodes.map((node, idx) => (
                  <div key={node.id} className="flex items-center gap-2">
                    <div
                      className={`rounded-2xl px-3 py-2 text-[11px] ring-1 ring-inset ${
                        node.type === 'start'
                          ? 'bg-sky-500/18 text-sky-200 ring-sky-400/40'
                          : node.type === 'end'
                            ? 'bg-emerald-500/18 text-emerald-200 ring-emerald-400/40'
                            : node.isBottleneck
                              ? 'bg-amber-500/18 text-amber-100 ring-amber-400/45'
                              : 'bg-white/[0.06] text-slate-100 ring-white/15'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 font-semibold">
                        {node.isBottleneck && (
                          <AlertTriangle className="h-3.5 w-3.5 text-amber-300" />
                        )}
                        <span>{node.label}</span>
                      </div>
                      <div className="mt-0.5 text-[10px] text-slate-300/80">
                        {node.role}
                      </div>
                    </div>
                    {idx < latestAnalysis.bpmnNodes.length - 1 && (
                      <FlowArrow className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RACI Responsibility Matrix */}
            <div className="overflow-hidden rounded-2xl bg-white/[0.04] ring-1 ring-inset ring-white/12">
              <div className="flex items-center justify-between border-b border-white/10 bg-white/[0.03] px-4 py-2.5">
                <h3 className="text-[12.5px] font-bold text-white">
                  {t.documentAi.raciHeading}
                </h3>
                <span className="text-[11px] tabular-nums text-slate-400">
                  {formatLocaleDigits(latestAnalysis.extractedStepsCount, locale)}{' '}
                  {t.documentAi.activitiesSuffix}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[11.5px]">
                  <thead className="bg-white/[0.03] text-slate-300">
                    <tr>
                      <th
                        className={`px-3 py-2 font-semibold ${
                          isRtl ? 'text-right' : 'text-left'
                        }`}
                      >
                        {t.documentAi.raciCols.activity}
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        {t.documentAi.raciCols.intake}
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        {t.documentAi.raciCols.manager}
                      </th>
                      <th className="px-2 py-2 text-center font-semibold text-emerald-300">
                        {t.documentAi.raciCols.ai}
                      </th>
                      <th className="px-2 py-2 text-center font-semibold">
                        {t.documentAi.raciCols.logistics}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.08]">
                    {latestAnalysis.raciMatrix.map((row) => (
                      <tr key={row.activity} className="hover:bg-white/[0.04]">
                        <td className="max-w-[200px] truncate px-3 py-2 text-slate-100">
                          {row.activity}
                        </td>
                        {[
                          row.intakeSpecialist,
                          row.departmentManager,
                          row.aiEngine,
                          row.procurementTeam,
                        ].map((code, cIdx) => (
                          <td key={cIdx} className="px-2 py-2 text-center">
                            <span
                              className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[10.5px] font-bold ${
                                code === 'R'
                                  ? 'bg-emerald-500/25 text-emerald-200'
                                  : code === 'A'
                                    ? 'bg-amber-500/25 text-amber-200'
                                    : code === 'C'
                                      ? 'bg-sky-500/20 text-sky-200'
                                      : 'text-slate-500'
                              }`}
                            >
                              {code}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
