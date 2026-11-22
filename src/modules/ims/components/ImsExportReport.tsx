import { useRef, useState } from 'react';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Printer,
  RotateCcw,
  Upload,
} from 'lucide-react';
import {
  DOCUMENT_LAYERS,
  ISO_KNOWLEDGE_BASE,
  ISO_STANDARDS,
  ISO_STANDARD_LIST,
} from '../../../data/isoKnowledgeBase';
import { toPersianDigits } from '../../../simulation/engine';
import {
  buildUtf8Csv,
  calculateAspectSignificance,
  calculateAssetCriticality,
  calculateHiraRisk,
  computeImsReadiness,
  computeSeuCoverageSummary,
  makeEvaluationKey,
  validateImportedProjectJson,
} from '../calculations';
import type { ImsProjectState } from '../types';

interface ImsExportReportProps {
  project: ImsProjectState;
  onImportProject: (next: ImsProjectState) => void;
  onResetDemoData: () => void;
  onUpdateOrgName: (name: string) => void;
}

function triggerFileDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function ImsExportReport({
  project,
  onImportProject,
  onResetDemoData,
  onUpdateOrgName,
}: ImsExportReportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{
    tone: 'ok' | 'err';
    message: string;
  } | null>(null);

  const readiness = computeImsReadiness(project.evaluations);
  const seuSummary = computeSeuCoverageSummary(project.energyConsumers);
  const openCapas = project.capas.filter((c) => c.status !== 'verified');
  const significantAspects = project.environmentalAspects.filter(
    (a) => calculateAspectSignificance(a.severity, a.probability, a.legalFactor).isSignificant
  );

  const handleExportJson = () => {
    const payload = JSON.stringify(
      { ...project, lastUpdated: new Date().toISOString().slice(0, 10) },
      null,
      2
    );
    triggerFileDownload(
      payload,
      `petros-ims-backup-${new Date().toISOString().slice(0, 10)}.json`,
      'application/json;charset=utf-8'
    );
    setFeedback({
      tone: 'ok',
      message: 'فایل پشتیبان کامل پروژه (JSON) با موفقیت ذخیره شد.',
    });
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = validateImportedProjectJson(String(reader.result ?? ''));
      if (result.ok) {
        onImportProject(result.data);
        setFeedback({
          tone: 'ok',
          message: 'پشتیبان پروژه IMS با موفقیت بازیابی و در حافظه محلی ذخیره شد.',
        });
      } else {
        setFeedback({ tone: 'err', message: result.error });
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  const handleExportGapCsv = () => {
    const headers = ['بند', 'عنوان بند', 'استاندارد', 'تمرکز تخصصی', 'وضعیت', 'یادداشت', 'شاهد عینی'];
    const rows: Array<Array<string | number | boolean>> = [];
    for (const clause of ISO_KNOWLEDGE_BASE) {
      for (const std of ISO_STANDARD_LIST) {
        const ev = project.evaluations[makeEvaluationKey(clause.clauseNumber, std)];
        rows.push([
          clause.clauseNumber,
          clause.title,
          `ISO ${std}`,
          clause.standards[std].focusTitle,
          ev?.status ?? 'in_progress',
          ev?.notes ?? '',
          ev?.evidenceLink ?? '',
        ]);
      }
    }
    triggerFileDownload(
      buildUtf8Csv(headers, rows),
      'petros-ims-gap-analysis.csv',
      'text/csv;charset=utf-8'
    );
    setFeedback({ tone: 'ok', message: 'فایل اکسل/CSV تحلیل شکاف دانلود شد.' });
  };

  const handleExportCapaCsv = () => {
    const headers = ['کد', 'استاندارد', 'بند', 'شدت', 'عنوان', 'علت ریشه‌ای', 'اقدام اصلاحی', 'مسئول', 'مهلت', 'وضعیت'];
    const rows = project.capas.map((c) => [
      c.id,
      `ISO ${c.standard}`,
      c.clauseNumber,
      c.severity,
      c.title,
      c.rootCause,
      c.correctiveAction,
      c.owner,
      c.deadline,
      c.status,
    ]);
    triggerFileDownload(
      buildUtf8Csv(headers, rows),
      'petros-ims-capa-register.csv',
      'text/csv;charset=utf-8'
    );
    setFeedback({ tone: 'ok', message: 'فایل اکسل/CSV فهرست اقدامات اصلاحی (CAPA) دانلود شد.' });
  };

  const handleExportAssetsCsv = () => {
    const headers = [
      'کد',
      'نام تجهیز/فرآیند',
      'واحد',
      'بحرانیت 55001',
      'استراتژی نت',
      'SEU 50001',
      'EnB',
      'مصرف واقعی',
      'ریسک اولیه 45001',
      'ریسک باقی‌مانده 45001',
      'امتیاز جنبه 14001',
    ];
    const rows = project.assets.map((a) => {
      const crit = calculateAssetCriticality(a.iso55001.consequence, a.iso55001.likelihood);
      const hira = calculateHiraRisk(
        a.iso45001.initialSeverity,
        a.iso45001.initialLikelihood,
        a.iso45001.controlsApplied
      );
      const asp = calculateAspectSignificance(
        a.iso14001.severity,
        a.iso14001.probability,
        a.iso14001.legalFactor
      );
      return [
        a.code,
        a.name,
        a.unit,
        `${crit.label} (${crit.score})`,
        a.iso55001.maintenanceStrategy,
        a.iso50001.isSeu ? 'SEU' : 'عادی',
        a.iso50001.baselineEnb,
        a.iso50001.actualConsumption,
        hira.initialScore,
        hira.residualScore,
        `${asp.score} (${asp.bandLabel})`,
      ];
    });
    triggerFileDownload(
      buildUtf8Csv(headers, rows),
      'petros-ims-assets-4d.csv',
      'text/csv;charset=utf-8'
    );
    setFeedback({ tone: 'ok', message: 'فایل اکسل/CSV مرکز تجهیزات ۴ بُعدی دانلود شد.' });
  };

  const handleExportDocsCsv = () => {
    const headers = ['کد سند', 'لایه مستندسازی', 'عنوان سند', 'استانداردها', 'بند مرجع', 'وضعیت', 'متولی'];
    const rows = project.documents.map((d) => [
      d.code,
      DOCUMENT_LAYERS[d.layer].title,
      d.title,
      d.standards.map((s) => `ISO ${s}`).join(' / '),
      d.clauseRef,
      d.status,
      d.owner,
    ]);
    triggerFileDownload(
      buildUtf8Csv(headers, rows),
      'petros-ims-documented-info-map.csv',
      'text/csv;charset=utf-8'
    );
    setFeedback({ tone: 'ok', message: 'فایل اکسل/CSV نقشه اطلاعات مدون دانلود شد.' });
  };

  return (
    <div className="space-y-6">
      {/* Action Panel (Hidden during Print) */}
      <div className="ims-no-print space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <h2 className="text-[16px] font-bold text-white">
              خروجی گزارش ممیزی، اکسل (CSV) و پشتیبان‌گیری کامل پروژه (JSON)
            </h2>
            <p className="mt-0.5 text-[12px] text-slate-400">
              تمامی داده‌ها ۱۰۰٪ سمت کاربر در مرورگر (IndexedDB) ذخیره می‌شوند — بدون هیچ سرور خارجی یا هزینه
            </p>
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            data-testid="btn-print-ims-report"
            className="flex cursor-pointer items-center gap-2 whitespace-nowrap rounded-xl bg-sky-500/25 px-4 py-2 text-[12.5px] font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/45 hover:bg-sky-500/35"
          >
            <Printer className="h-4 w-4 text-sky-300" />
            <span>چاپ / ذخیره PDF گزارش ممیزی</span>
          </button>
        </div>

        {/* Organization Name + Backup/Restore & CSV Export Grid */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* JSON Backup & Restore */}
          <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10">
            <div className="flex items-center gap-2">
              <FileJson className="h-4 w-4 text-sky-300" />
              <h3 className="text-[13.5px] font-bold text-white">
                پشتیبان‌گیری و بازیابی کامل پروژه (JSON Backup / Restore)
              </h3>
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">
                نام سازمان در سرصفحه گزارش ممیزی
              </label>
              <input
                type="text"
                value={project.organizationName}
                onChange={(e) => onUpdateOrgName(e.target.value)}
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportJson}
                data-testid="btn-export-json"
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/10 px-3.5 py-2 text-[12px] font-semibold text-white ring-1 ring-inset ring-white/20 hover:bg-white/18"
              >
                <Download className="h-3.5 w-3.5 text-sky-300" />
                <span>دانلود پشتیبان JSON</span>
              </button>

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl bg-white/[0.05] px-3.5 py-2 text-[12px] font-semibold text-slate-200 ring-1 ring-inset ring-white/15 hover:bg-white/12"
              >
                <Upload className="h-3.5 w-3.5 text-emerald-300" />
                <span>بازیابی از فایل JSON</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleImportJson}
                className="hidden"
              />

              <button
                type="button"
                onClick={() => {
                  onResetDemoData();
                  setFeedback({
                    tone: 'ok',
                    message: 'داده‌های نمونه پیش‌فرض صنعتی مجدداً بارگذاری شدند.',
                  });
                }}
                className="flex cursor-pointer items-center gap-1.5 rounded-xl px-3 py-2 text-[11.5px] text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <RotateCcw className="h-3.5 w-3.5" />
                <span>بازنشانی داده نمونه</span>
              </button>
            </div>
          </div>

          {/* Excel-Compatible UTF-8 CSV Downloads */}
          <div className="space-y-3 rounded-2xl bg-white/[0.03] p-4 ring-1 ring-inset ring-white/10">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="h-4 w-4 text-emerald-300" />
              <h3 className="text-[13.5px] font-bold text-white">
                خروجی جدول‌های اکسل (UTF-8 CSV با پشتیبانی کامل فارسی)
              </h3>
            </div>
            <p className="text-[11.5px] text-slate-400">
              هر فایل با استاندارد UTF-8 BOM تولید می‌شود تا مستقیماً بدون به‌هم‌ریختگی حروف در Excel باز شود.
            </p>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportGapCsv}
                data-testid="btn-export-gap-csv"
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-[12px] font-semibold text-slate-100 ring-1 ring-inset ring-white/15 hover:bg-white/12"
              >
                <Download className="h-3.5 w-3.5 text-emerald-300" />
                <span>تحلیل شکاف (Gap)</span>
              </button>
              <button
                type="button"
                onClick={handleExportCapaCsv}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-[12px] font-semibold text-slate-100 ring-1 ring-inset ring-white/15 hover:bg-white/12"
              >
                <Download className="h-3.5 w-3.5 text-amber-300" />
                <span>فهرست CAPA</span>
              </button>
              <button
                type="button"
                onClick={handleExportAssetsCsv}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-[12px] font-semibold text-slate-100 ring-1 ring-inset ring-white/15 hover:bg-white/12"
              >
                <Download className="h-3.5 w-3.5 text-violet-300" />
                <span>تجهیزات ۴ بُعدی</span>
              </button>
              <button
                type="button"
                onClick={handleExportDocsCsv}
                className="flex cursor-pointer items-center justify-center gap-1.5 rounded-xl bg-white/[0.06] px-3 py-2 text-[12px] font-semibold text-slate-100 ring-1 ring-inset ring-white/15 hover:bg-white/12"
              >
                <Download className="h-3.5 w-3.5 text-sky-300" />
                <span>نقشه اطلاعات مدون</span>
              </button>
            </div>
          </div>
        </div>

        {feedback && (
          <div
            role="status"
            className={`rounded-xl px-4 py-2.5 text-[12px] font-medium ring-1 ring-inset ${
              feedback.tone === 'ok'
                ? 'bg-emerald-500/15 text-emerald-200 ring-emerald-400/35'
                : 'bg-rose-500/15 text-rose-200 ring-rose-400/35'
            }`}
          >
            {feedback.message}
          </div>
        )}
      </div>

      {/* Printable Audit Readiness Report Preview */}
      <article
        data-testid="ims-printable-report"
        className="ims-print-surface space-y-5 rounded-2xl bg-white/[0.03] p-6 ring-1 ring-inset ring-white/12"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-white/15 pb-4">
          <div>
            <h3 className="text-[17px] font-bold text-white">
              گزارش خلاصه آمادگی ممیزی سیستم مدیریت یکپارچه (IMS Audit Readiness Report)
            </h3>
            <p className="mt-1 text-[12.5px] text-slate-300">
              {project.organizationName}
            </p>
          </div>
          <div className="text-[11.5px] text-slate-400 tabular-nums">
            تاریخ گزارش: {project.lastUpdated} · آمادگی کل: {toPersianDigits(readiness.overallPct)}٪
          </div>
        </div>

        {/* Executive Readiness Table */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {ISO_STANDARD_LIST.map((std) => {
            const s = readiness.byStandard[std];
            return (
              <div
                key={std}
                className="rounded-xl bg-white/[0.03] p-3 ring-1 ring-inset ring-white/10"
              >
                <div className="text-[11.5px] font-semibold text-slate-300" dir="ltr">
                  {ISO_STANDARDS[std].shortLabel}
                </div>
                <div className="mt-1 text-[20px] font-bold text-white tabular-nums">
                  {toPersianDigits(s.readinessPct)}٪
                </div>
                <div className="mt-0.5 text-[11px] text-slate-400 tabular-nums">
                  منطبق: {toPersianDigits(s.compliantCount)} · NC:{' '}
                  {toPersianDigits(s.minorNcCount + s.majorNcCount)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Key Operational Indicators */}
        <div className="grid grid-cols-1 gap-4 border-t border-white/10 pt-4 text-[12px] md:grid-cols-2">
          <div className="space-y-1.5">
            <h4 className="font-bold text-white">خلاصه شاخص‌های کلیدی چهار استاندارد</h4>
            <ul className="space-y-1 text-slate-300 tabular-nums">
              <li>
                • ISO 14001: تعداد {toPersianDigits(significantAspects.length)} جنبه زیست‌محیطی بارز از{' '}
                {toPersianDigits(project.environmentalAspects.length)} مورد ثبت‌شده
              </li>
              <li>
                • ISO 45001: تعداد {toPersianDigits(project.hiraRisks.length)} سناریوی خطر HIRA با سلسله‌مراتب کنترل‌ها
              </li>
              <li>
                • ISO 50001: سهم مصرف‌کنندگان بارز (SEU) برابر {toPersianDigits(seuSummary.seuSharePct)}٪ با تغییر{' '}
                <span dir="ltr">{seuSummary.overallChangePct}%</span> نسبت به EnB
              </li>
              <li>
                • ISO 55001: تعداد {toPersianDigits(project.assets.length)} دارایی/فرآیند ثبت‌شده و سند SAMP فعال
              </li>
            </ul>
          </div>

          <div className="space-y-1.5">
            <h4 className="font-bold text-white">اقدامات اصلاحی باز (Open CAPA — {toPersianDigits(openCapas.length)})</h4>
            {openCapas.length === 0 ? (
              <p className="text-emerald-300">تمامی اقدامات اصلاحی بسته و اثربخش ارزیابی شده‌اند.</p>
            ) : (
              <ul className="space-y-1 text-slate-300">
                {openCapas.slice(0, 5).map((c) => (
                  <li key={c.id} className="truncate">
                    • [ISO {c.standard} - بند {toPersianDigits(c.clauseNumber)}] {c.title} (مسئول: {c.owner})
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* SAMP Executive Summary */}
        <div className="border-t border-white/10 pt-4 text-[12px]">
          <h4 className="font-bold text-white">خلاصه طرح راهبردی مدیریت دارایی (SAMP — ISO 55001)</h4>
          <p className="mt-1 leading-relaxed text-slate-300">{project.samp.organizationMission}</p>
          <p className="mt-1 text-[11.5px] text-slate-400">
            شاخص‌های کلیدی: {project.samp.kpiMetrics}
          </p>
        </div>
      </article>
    </div>
  );
}
