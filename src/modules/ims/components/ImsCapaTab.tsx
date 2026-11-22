import { useState } from 'react';
import { CheckCircle2, Plus, Trash2 } from 'lucide-react';
import { ISO_STANDARDS, ISO_STANDARD_LIST } from '../../../data/isoKnowledgeBase';
import { toPersianDigits } from '../../../simulation/engine';
import type { CapaStatus, ImsCapaItem, IsoStandardCode } from '../types';

interface ImsCapaTabProps {
  capas: ImsCapaItem[];
  onAddCapa: (item: Omit<ImsCapaItem, 'id' | 'createdAt'>) => void;
  onUpdateCapa: (id: string, patch: Partial<ImsCapaItem>) => void;
  onDeleteCapa: (id: string) => void;
}

const CAPA_STATUS_LABELS: Record<CapaStatus, { label: string; colorClass: string }> = {
  open: { label: 'باز (نیازمند اقدام)', colorClass: 'text-rose-300' },
  in_progress: { label: 'در حال اجرا', colorClass: 'text-amber-300' },
  verified: { label: 'بسته‌شده و اثربخش', colorClass: 'text-emerald-300' },
};

export function ImsCapaTab({
  capas,
  onAddCapa,
  onUpdateCapa,
  onDeleteCapa,
}: ImsCapaTabProps) {
  const [filterStd, setFilterStd] = useState<IsoStandardCode | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<CapaStatus | 'all'>('all');
  const [showForm, setShowForm] = useState(false);

  const [standard, setStandard] = useState<IsoStandardCode>('14001');
  const [clauseNumber, setClauseNumber] = useState('8.1');
  const [severity, setSeverity] = useState<'minor_nc' | 'major_nc'>('minor_nc');
  const [title, setTitle] = useState('');
  const [rootCause, setRootCause] = useState('');
  const [correctiveAction, setCorrectiveAction] = useState('');
  const [owner, setOwner] = useState('');
  const [deadline, setDeadline] = useState('2026-12-20');
  const [formError, setFormError] = useState('');

  const filtered = capas.filter((c) => {
    if (filterStd !== 'all' && c.standard !== filterStd) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  });

  const openCount = capas.filter((c) => c.status === 'open').length;
  const inProgressCount = capas.filter((c) => c.status === 'in_progress').length;
  const verifiedCount = capas.filter((c) => c.status === 'verified').length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !owner.trim()) {
      setFormError('لطفاً عنوان عدم انطباق و مسئول اجرا را وارد کنید.');
      return;
    }
    setFormError('');
    onAddCapa({
      clauseNumber: clauseNumber.trim() || '10.1',
      standard,
      severity,
      title: title.trim(),
      rootCause: rootCause.trim() || 'در حال تحلیل علت ریشه‌ای (RCA)',
      correctiveAction: correctiveAction.trim() || 'تدوین و اجرای برنامه اقدام اصلاحی',
      owner: owner.trim(),
      deadline,
      status: 'open',
    });
    setTitle('');
    setRootCause('');
    setCorrectiveAction('');
    setOwner('');
    setShowForm(false);
  };

  return (
    <div className="space-y-5">
      {/* Header & Summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-[16px] font-bold text-white">
            مدیریت عدم انطباق‌ها و اقدامات اصلاحی (CAPA)
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-400">
            همگام‌سازی خودکار با تحلیل شکاف (Gap Analysis) — هر بند با وضعیت Minor NC یا Major NC به‌صورت خودکار اینجا ثبت می‌شود
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((v) => !v)}
          data-testid="btn-toggle-new-capa"
          className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-sky-500/20 px-3.5 py-2 text-[12px] font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/40 transition-colors hover:bg-sky-500/30"
        >
          <Plus className="h-4 w-4 text-sky-300" />
          <span>ثبت اقدام اصلاحی جدید</span>
        </button>
      </div>

      {/* Inline KPI Metrics & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-[12.5px] tabular-nums">
          <span className="text-slate-300">
            کل موارد: <strong className="text-white">{toPersianDigits(capas.length)}</strong>
          </span>
          <span aria-hidden="true" className="text-white/20">·</span>
          <span className="text-rose-300">
            باز: <strong>{toPersianDigits(openCount)}</strong>
          </span>
          <span aria-hidden="true" className="text-white/20">·</span>
          <span className="text-amber-300">
            در حال اجرا: <strong>{toPersianDigits(inProgressCount)}</strong>
          </span>
          <span aria-hidden="true" className="text-white/20">·</span>
          <span className="text-emerald-300">
            اثربخش و بسته: <strong>{toPersianDigits(verifiedCount)}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="فیلتر استاندارد CAPA"
            value={filterStd}
            onChange={(e) => setFilterStd(e.target.value as IsoStandardCode | 'all')}
            className="cursor-pointer rounded-xl bg-slate-900/90 px-3 py-1.5 text-[12px] text-slate-200 ring-1 ring-inset ring-white/15"
          >
            <option value="all">همه استانداردها</option>
            {ISO_STANDARD_LIST.map((s) => (
              <option key={s} value={s}>
                ISO {s}
              </option>
            ))}
          </select>

          <select
            aria-label="فیلتر وضعیت CAPA"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as CapaStatus | 'all')}
            className="cursor-pointer rounded-xl bg-slate-900/90 px-3 py-1.5 text-[12px] text-slate-200 ring-1 ring-inset ring-white/15"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="open">باز</option>
            <option value="in_progress">در حال اجرا</option>
            <option value="verified">بسته‌شده و اثربخش</option>
          </select>
        </div>
      </div>

      {/* New Manual CAPA Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/15"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">استاندارد</label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value as IsoStandardCode)}
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              >
                {ISO_STANDARD_LIST.map((s) => (
                  <option key={s} value={s}>
                    ISO {s} — {ISO_STANDARDS[s].persianName}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">بند مرجع</label>
              <input
                type="text"
                value={clauseNumber}
                onChange={(e) => setClauseNumber(e.target.value)}
                placeholder="مثلاً 8.1"
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">سطح عدم انطباق</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as 'minor_nc' | 'major_nc')}
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              >
                <option value="minor_nc">عدم انطباق جزئی (Minor NC)</option>
                <option value="major_nc">عدم انطباق کلی (Major NC)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11.5px] text-slate-300">عنوان عدم انطباق</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="شرح دقیق عدم انطباق مشاهده‌شده..."
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">مسئول اقدام</label>
              <input
                type="text"
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                placeholder="مثلاً سرپرست HSE"
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">علت ریشه‌ای (RCA)</label>
              <input
                type="text"
                value={rootCause}
                onChange={(e) => setRootCause(e.target.value)}
                placeholder="تحلیل ۵ چرا / استخوان ماهی..."
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">اقدام اصلاحی</label>
              <input
                type="text"
                value={correctiveAction}
                onChange={(e) => setCorrectiveAction(e.target.value)}
                placeholder="اقدام اجرایی برای جلوگیری از تکرار..."
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11.5px] text-slate-300">مهلت اجرا</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                dir="ltr"
                className="w-full rounded-lg bg-slate-900 px-3 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
          </div>

          {formError && <p className="text-[12px] text-rose-300">{formError}</p>}

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="cursor-pointer rounded-lg px-3 py-1.5 text-[12px] text-slate-300 hover:bg-white/10"
            >
              انصراف
            </button>
            <button
              type="submit"
              className="cursor-pointer rounded-lg bg-emerald-500/25 px-4 py-1.5 text-[12px] font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-400/40 hover:bg-emerald-500/35"
            >
              ثبت در فهرست CAPA
            </button>
          </div>
        </form>
      )}

      {/* CAPA List */}
      <div className="divide-y divide-white/10 rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/10">
        {filtered.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-slate-400">
            هیچ اقدام اصلاحی (CAPA) در این فیلتر ثبت نشده است.
          </div>
        ) : (
          filtered.map((item) => {
            const stdMeta = ISO_STANDARDS[item.standard];
            const stMeta = CAPA_STATUS_LABELS[item.status];
            return (
              <div
                key={item.id}
                data-testid={`capa-item-${item.id}`}
                className="space-y-3 p-4 transition-colors hover:bg-white/[0.02]"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 text-[11.5px] text-slate-400">
                      <span className={`font-bold ${stdMeta.accentClass}`} dir="ltr">
                        {stdMeta.shortLabel}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono text-slate-300">
                        بند {toPersianDigits(item.clauseNumber)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          item.severity === 'major_nc'
                            ? 'font-semibold text-rose-300'
                            : 'font-semibold text-amber-300'
                        }
                      >
                        {item.severity === 'major_nc'
                          ? 'عدم انطباق کلی (Major NC)'
                          : 'عدم انطباق جزئی (Minor NC)'}
                      </span>
                      {item.sourceEvaluationKey && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-sky-300/90">خودکار از تحلیل شکاف</span>
                        </>
                      )}
                    </div>
                    <h3 className="mt-1 text-[13.5px] font-semibold text-white">
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      aria-label={`وضعیت اقدام اصلاحی ${item.title}`}
                      value={item.status}
                      onChange={(e) =>
                        onUpdateCapa(item.id, { status: e.target.value as CapaStatus })
                      }
                      className={`cursor-pointer rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] font-semibold ring-1 ring-inset ring-white/20 ${stMeta.colorClass}`}
                    >
                      <option value="open" className="bg-slate-900 text-rose-300">
                        باز (نیازمند اقدام)
                      </option>
                      <option value="in_progress" className="bg-slate-900 text-amber-300">
                        در حال اجرا
                      </option>
                      <option value="verified" className="bg-slate-900 text-emerald-300">
                        بسته‌شده و اثربخش
                      </option>
                    </select>

                    {item.status !== 'verified' && (
                      <button
                        type="button"
                        onClick={() => onUpdateCapa(item.id, { status: 'verified' })}
                        aria-label={`تایید اثربخشی ${item.title}`}
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/30 hover:bg-emerald-500/25"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onDeleteCapa(item.id)}
                      aria-label={`حذف اقدام اصلاحی ${item.title}`}
                      className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-rose-500/15 hover:text-rose-300"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Editable Owner, Deadline, Root Cause, Corrective Action */}
                <div className="grid grid-cols-1 gap-2.5 md:grid-cols-4">
                  <div className="md:col-span-2">
                    <label className="mb-1 block text-[10.5px] text-slate-400">
                      علت ریشه‌ای (Root Cause)
                    </label>
                    <input
                      type="text"
                      value={item.rootCause}
                      onChange={(e) =>
                        onUpdateCapa(item.id, { rootCause: e.target.value })
                      }
                      className="w-full rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-slate-100 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-sky-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10.5px] text-slate-400">
                      مسئول اجرا (Owner)
                    </label>
                    <input
                      type="text"
                      value={item.owner}
                      onChange={(e) => onUpdateCapa(item.id, { owner: e.target.value })}
                      className="w-full rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-slate-100 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-sky-400/50"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-[10.5px] text-slate-400">
                      مهلت تکمیل (Deadline)
                    </label>
                    <input
                      type="date"
                      value={item.deadline}
                      onChange={(e) =>
                        onUpdateCapa(item.id, { deadline: e.target.value })
                      }
                      dir="ltr"
                      className="w-full rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-slate-100 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-sky-400/50"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-[10.5px] text-slate-400">
                    شرح اقدام اصلاحی (Corrective Action)
                  </label>
                  <input
                    type="text"
                    value={item.correctiveAction}
                    onChange={(e) =>
                      onUpdateCapa(item.id, { correctiveAction: e.target.value })
                    }
                    className="w-full rounded-lg bg-white/[0.04] px-2.5 py-1.5 text-[11.5px] text-slate-100 ring-1 ring-inset ring-white/10 focus:outline-none focus:ring-sky-400/50"
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
