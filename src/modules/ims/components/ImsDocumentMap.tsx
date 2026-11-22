import { useState } from 'react';
import { FolderTree, Plus } from 'lucide-react';
import {
  DOCUMENT_LAYERS,
  ISO_STANDARD_LIST,
} from '../../../data/isoKnowledgeBase';
import { toPersianDigits } from '../../../simulation/engine';
import type {
  DocumentLayer,
  DocumentMapEntry,
  DocumentStatus,
  IsoStandardCode,
} from '../types';

interface ImsDocumentMapProps {
  documents: DocumentMapEntry[];
  onUpdateDocument: (id: string, patch: Partial<DocumentMapEntry>) => void;
  onAddDocument: (entry: Omit<DocumentMapEntry, 'id'>) => void;
}

const LAYER_ORDER: DocumentLayer[] = [
  'policy_strategy',
  'procedure',
  'work_instruction',
  'record_form',
];

const DOC_STATUS_LABELS: Record<DocumentStatus, { label: string; colorClass: string }> = {
  available: { label: 'موجود و معتبر', colorClass: 'text-emerald-300' },
  needs_review: { label: 'نیازمند بازنگری', colorClass: 'text-amber-300' },
  missing: { label: 'مفقود / تدوین‌نشده', colorClass: 'text-rose-300' },
};

export function ImsDocumentMap({
  documents,
  onUpdateDocument,
  onAddDocument,
}: ImsDocumentMapProps) {
  const [stdFilter, setStdFilter] = useState<IsoStandardCode | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<DocumentStatus | 'all'>('all');
  const [layerFilter, setLayerFilter] = useState<DocumentLayer | 'all'>('all');
  const [showAdd, setShowAdd] = useState(false);

  const [newCode, setNewCode] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newLayer, setNewLayer] = useState<DocumentLayer>('procedure');
  const [newClause, setNewClause] = useState('8.1');
  const [newOwner, setNewOwner] = useState('دفتر IMS');
  const [newStds, setNewStds] = useState<IsoStandardCode[]>(['14001', '45001']);

  const filtered = documents.filter((doc) => {
    if (stdFilter !== 'all' && !doc.standards.includes(stdFilter)) return false;
    if (statusFilter !== 'all' && doc.status !== statusFilter) return false;
    if (layerFilter !== 'all' && doc.layer !== layerFilter) return false;
    return true;
  });

  const availableCount = documents.filter((d) => d.status === 'available').length;
  const reviewCount = documents.filter((d) => d.status === 'needs_review').length;
  const missingCount = documents.filter((d) => d.status === 'missing').length;

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    const prefix = DOCUMENT_LAYERS[newLayer].codePrefix;
    onAddDocument({
      code: newCode.trim() || `${prefix}-IMS-${documents.length + 1}`,
      title: newTitle.trim(),
      layer: newLayer,
      standards: newStds.length > 0 ? newStds : ['14001'],
      clauseRef: newClause.trim() || '7.5',
      mandatory: true,
      status: 'needs_review',
      owner: newOwner.trim() || 'دفتر IMS',
    });
    setNewCode('');
    setNewTitle('');
    setShowAdd(false);
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-[16px] font-bold text-white">
            نقشه اطلاعات مدون یکپارچه (Documented Information Map — بند ۷.۵)
          </h2>
          <p className="mt-0.5 text-[12px] text-slate-400">
            ساختار ۴ لایه استاندارد اسناد IMS — کد سند و وضعیت موجودیت هر مدرک را مستقیماً ویرایش کنید
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowAdd((v) => !v)}
          className="flex cursor-pointer items-center gap-1.5 whitespace-nowrap rounded-xl bg-sky-500/20 px-3.5 py-2 text-[12px] font-semibold text-sky-100 ring-1 ring-inset ring-sky-400/40 hover:bg-sky-500/30"
        >
          <Plus className="h-4 w-4 text-sky-300" />
          <span>افزودن مدرک جدید</span>
        </button>
      </div>

      {/* Inline Summary & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3.5 text-[12px] tabular-nums">
          <span className="text-emerald-300">
            موجود: <strong>{toPersianDigits(availableCount)}</strong>
          </span>
          <span aria-hidden="true" className="text-white/20">·</span>
          <span className="text-amber-300">
            نیازمند بازنگری: <strong>{toPersianDigits(reviewCount)}</strong>
          </span>
          <span aria-hidden="true" className="text-white/20">·</span>
          <span className="text-rose-300">
            مفقود: <strong>{toPersianDigits(missingCount)}</strong>
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            aria-label="فیلتر لایه سند"
            value={layerFilter}
            onChange={(e) => setLayerFilter(e.target.value as DocumentLayer | 'all')}
            className="cursor-pointer rounded-xl bg-slate-900/90 px-3 py-1.5 text-[12px] text-slate-200 ring-1 ring-inset ring-white/15"
          >
            <option value="all">همه ۴ لایه اسناد</option>
            {LAYER_ORDER.map((l) => (
              <option key={l} value={l}>
                {toPersianDigits(DOCUMENT_LAYERS[l].order)}. {DOCUMENT_LAYERS[l].title}
              </option>
            ))}
          </select>

          <select
            aria-label="فیلتر استاندارد سند"
            value={stdFilter}
            onChange={(e) => setStdFilter(e.target.value as IsoStandardCode | 'all')}
            className="cursor-pointer rounded-xl bg-slate-900/90 px-3 py-1.5 text-[12px] text-slate-200 ring-1 ring-inset ring-white/15"
          >
            <option value="all">همه استانداردها</option>
            {ISO_STANDARD_LIST.map((s) => (
              <option key={s} value={s}>ISO {s}</option>
            ))}
          </select>

          <select
            aria-label="فیلتر وضعیت سند"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as DocumentStatus | 'all')}
            className="cursor-pointer rounded-xl bg-slate-900/90 px-3 py-1.5 text-[12px] text-slate-200 ring-1 ring-inset ring-white/15"
          >
            <option value="all">همه وضعیت‌ها</option>
            <option value="available">موجود</option>
            <option value="needs_review">نیازمند بازنگری</option>
            <option value="missing">مفقود</option>
          </select>
        </div>
      </div>

      {/* Add Document Form */}
      {showAdd && (
        <form
          onSubmit={handleAdd}
          className="space-y-3 rounded-2xl bg-white/[0.04] p-4 ring-1 ring-inset ring-white/15"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">کد سند</label>
              <input
                type="text"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value)}
                placeholder="PRO-IMS-09"
                dir="ltr"
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-[11px] text-slate-400">عنوان سند / مدرک</label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="مثلاً دستورالعمل کالیبراسیون کنتورهای انرژی"
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              />
            </div>
            <div>
              <label className="mb-1 block text-[11px] text-slate-400">لایه مستندسازی</label>
              <select
                value={newLayer}
                onChange={(e) => setNewLayer(e.target.value as DocumentLayer)}
                className="w-full rounded-lg bg-slate-900 px-2.5 py-1.5 text-[12px] text-white ring-1 ring-inset ring-white/15"
              >
                {LAYER_ORDER.map((l) => (
                  <option key={l} value={l}>
                    {toPersianDigits(DOCUMENT_LAYERS[l].order)}. {DOCUMENT_LAYERS[l].title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 text-[11.5px]">
              <span className="text-slate-400">استانداردهای مرتبط:</span>
              {ISO_STANDARD_LIST.map((std) => {
                const on = newStds.includes(std);
                return (
                  <button
                    key={std}
                    type="button"
                    onClick={() =>
                      setNewStds((prev) =>
                        prev.includes(std) ? prev.filter((s) => s !== std) : [...prev, std]
                      )
                    }
                    className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-semibold ring-1 ring-inset ${
                      on
                        ? 'bg-sky-500/20 text-sky-100 ring-sky-400/40'
                        : 'bg-white/[0.04] text-slate-400 ring-white/10'
                    }`}
                    dir="ltr"
                  >
                    ISO {std}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newClause}
                onChange={(e) => setNewClause(e.target.value)}
                placeholder="بند (مثلاً 9.1)"
                className="w-24 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] text-white ring-1 ring-inset ring-white/15"
              />
              <input
                type="text"
                value={newOwner}
                onChange={(e) => setNewOwner(e.target.value)}
                placeholder="مسئول"
                className="w-32 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] text-white ring-1 ring-inset ring-white/15"
              />
              <button
                type="submit"
                className="cursor-pointer rounded-lg bg-emerald-500/25 px-4 py-1.5 text-[12px] font-semibold text-emerald-100 ring-1 ring-inset ring-emerald-400/40 hover:bg-emerald-500/35"
              >
                ثبت مدرک
              </button>
            </div>
          </div>
        </form>
      )}

      {/* 4 Strict Organizational Layers */}
      <div className="space-y-6">
        {LAYER_ORDER.map((layerKey) => {
          const layerInfo = DOCUMENT_LAYERS[layerKey];
          const layerDocs = filtered.filter((d) => d.layer === layerKey);
          if (layerFilter !== 'all' && layerFilter !== layerKey) return null;

          return (
            <section key={layerKey} className="space-y-2.5">
              <div className="flex items-baseline justify-between gap-2 px-1">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-sky-300" />
                  <h3 className="text-[14px] font-bold text-white">
                    {toPersianDigits(layerInfo.order)}. {layerInfo.title}
                  </h3>
                  <span className="text-[11.5px] text-slate-400">
                    — {layerInfo.subtitle}
                  </span>
                </div>
                <span className="text-[11.5px] text-slate-400 tabular-nums">
                  {toPersianDigits(layerDocs.length)} سند
                </span>
              </div>

              <div className="divide-y divide-white/10 rounded-2xl bg-white/[0.02] ring-1 ring-inset ring-white/10">
                {layerDocs.length === 0 ? (
                  <div className="p-4 text-[12px] text-slate-500">
                    مدرکی در این لایه با فیلتر فعلی یافت نشد.
                  </div>
                ) : (
                  layerDocs.map((doc) => (
                    <div
                      key={doc.id}
                      className="grid grid-cols-1 items-center gap-3 px-4 py-3 text-[12px] lg:grid-cols-12"
                    >
                      <div className="lg:col-span-2">
                        <input
                          type="text"
                          value={doc.code}
                          aria-label={`کد سند ${doc.title}`}
                          onChange={(e) =>
                            onUpdateDocument(doc.id, { code: e.target.value })
                          }
                          dir="ltr"
                          className="w-full rounded-lg bg-white/[0.04] px-2 py-1 font-mono text-[11.5px] font-semibold text-sky-200 ring-1 ring-inset ring-white/12 focus:outline-none focus:ring-sky-400"
                        />
                      </div>

                      <div className="lg:col-span-5">
                        <div className="font-medium text-white">{doc.title}</div>
                        <div className="mt-0.5 text-[11px] text-slate-400">
                          بند {toPersianDigits(doc.clauseRef)} · متولی: {doc.owner}
                          {doc.mandatory ? ' · الزامی ممیزی' : ''}
                        </div>
                      </div>

                      <div className="text-[11.5px] font-medium text-slate-300 lg:col-span-3" dir="ltr">
                        {doc.standards.map((s) => `ISO ${s}`).join(' · ')}
                      </div>

                      <div className="lg:col-span-2">
                        <select
                          aria-label={`وضعیت سند ${doc.code}`}
                          data-testid={`doc-status-${doc.id}`}
                          value={doc.status}
                          onChange={(e) =>
                            onUpdateDocument(doc.id, {
                              status: e.target.value as DocumentStatus,
                            })
                          }
                          className={`w-full cursor-pointer rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11.5px] font-semibold ring-1 ring-inset ring-white/15 ${
                            DOC_STATUS_LABELS[doc.status].colorClass
                          }`}
                        >
                          <option value="available" className="bg-slate-900 text-emerald-300">
                            موجود
                          </option>
                          <option value="needs_review" className="bg-slate-900 text-amber-300">
                            نیازمند بازنگری
                          </option>
                          <option value="missing" className="bg-slate-900 text-rose-300">
                            مفقود
                          </option>
                        </select>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
