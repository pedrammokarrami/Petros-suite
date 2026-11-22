import {
  MATURITY_WEIGHTS,
} from './data';
import {
  ARCHITECTURE_TREE_BY_LOCALE,
  MATURITY_DIMENSIONS_BY_LOCALE,
} from '../i18n/translations';
import type { Locale } from '../i18n/types';
import type {
  BpmnNode,
  CapaPlan,
  ComplianceClause,
  DocumentAnalysisResult,
  MaturityDimension,
  ProcessArchNode,
  RaciRow,
} from './types';
import type { SimMode } from '../simulation/types';

/**
 * Computes weighted Process Maturity Score (0-100) localized in FA or EN.
 * In baseline AS-IS with 0 resolved CAPAs, produces exactly 66%:
 * owner 90%, documentation 80%, KPI 65%, risk 70%, digitalization 40%.
 */
export function calculateMaturityBreakdown(
  mode: SimMode,
  resolvedCapaCount: number,
  locale: Locale = 'fa',
  dimensions: MaturityDimension[] = MATURITY_DIMENSIONS_BY_LOCALE[locale]
): {
  overall: number;
  dimensions: Array<{ key: MaturityDimension['key']; label: string; score: number }>;
  nextLevelLabel: string;
} {
  const capaBoost = Math.min(12, resolvedCapaCount * 4);
  const scored = dimensions.map((dim) => {
    const modeBoost = mode === 'TO_BE' ? dim.toBeBonus : 0;
    const extra =
      dim.key === 'risk' || dim.key === 'kpi' || dim.key === 'documentation'
        ? capaBoost
        : Math.round(capaBoost * 0.5);
    const score = Math.min(99, dim.baseScore + modeBoost + extra);
    return {
      key: dim.key,
      label: dim.label,
      score,
    };
  });

  let weightedSum = 0;
  for (const item of scored) {
    weightedSum += item.score * MATURITY_WEIGHTS[item.key];
  }
  const overall = Math.min(99, Math.round(weightedSum));

  const nextLevelLabel =
    locale === 'en'
      ? overall < 70
        ? 'Level 3 (Defined) — Gap to Level 4: elevate digitalization & remove approval bottlenecks'
        : overall < 88
          ? 'Level 4 (Quantitatively Managed) — Gap to Level 5: predictive AI & full CAPA closure'
          : 'Level 5 (AI-Optimizing) — Autonomous, closed-loop compliant enterprise workflow'
      : overall < 70
        ? 'سطح ۳ (تعریف‌شده) — فاصله تا سطح ۴: ارتقای دیجیتالی‌شدن و حذف گلوگاه تایید'
        : overall < 88
          ? 'سطح ۴ (مدیریت‌شده کمی) — فاصله تا سطح ۵: پایش پیش‌بینانه و تکمیل CAPA'
          : 'سطح ۵ (بهینه‌سازی هوشمند) — فرآیند خودکار و منطبق با استانداردهای برتر';

  return { overall, dimensions: scored, nextLevelLabel };
}

/**
 * Recursively finds a node in the Process Architecture Tree by ID.
 */
export function findArchitectureNode(
  nodes: ProcessArchNode[] = ARCHITECTURE_TREE_BY_LOCALE.fa,
  targetId: string
): ProcessArchNode | null {
  for (const node of nodes) {
    if (node.id === targetId) return node;
    if (node.children) {
      const found = findArchitectureNode(node.children, targetId);
      if (found) return found;
    }
  }
  return null;
}

function cleanClauseLine(line: string): string {
  return line
    .replace(/^(ماده|بند|گام|مرحله|clause|step|section)\s*[۰-۹0-9]+\s*[:：\-]?\s*/iu, '')
    .replace(/^[-•*0-9۰-۹.)]+\s*/u, '')
    .trim();
}

function summarizeStepLabel(clause: string, fallback: string): string {
  const cleaned = cleanClauseLine(clause);
  if (!cleaned) return fallback;
  const words = cleaned.split(/\s+/).filter(Boolean);
  const clipped = words.slice(0, 6).join(' ');
  return words.length > 6 ? `${clipped}...` : clipped;
}

function compactZoneLabel(clause: string, fallback: string): string {
  const cleaned = cleanClauseLine(clause);
  if (!cleaned) return fallback;
  const words = cleaned.split(/\s+/).filter(Boolean);
  return words.slice(0, 3).join(' ');
}

function inferStepRoleAndZone(
  text: string,
  locale: Locale
): {
  role: string;
  zoneId: BpmnNode['zoneId'];
  type: BpmnNode['type'];
  isBottleneck: boolean;
} {
  const lower = text.toLowerCase();
  if (/هوش مصنوعی|خودکار|سیستمی|autonomous|ai\b|automated/.test(lower)) {
    return {
      role: locale === 'en' ? 'Autonomous AI Core' : 'هسته هوش مصنوعی',
      zoneId: 'ai_core',
      type: 'task',
      isBottleneck: false,
    };
  }
  if (/تایید|امضا|مدیر|کمیته|گلوگاه|تصمیم|بازبینی|تأخیر|approve|approval|manager|sign-off|bottleneck|signature/.test(lower)) {
    return {
      role: locale === 'en' ? 'Department Manager' : 'مدیر واحد اجرایی',
      zoneId: 'approval',
      type: 'gateway',
      isBottleneck: true,
    };
  }
  if (/انبار|لجستیک|تدارکات|تحویل|ارسال|بارکد|نقاله|قطعه|بسته‌بندی|warehouse|logistics|conveyor|dispatch|barcode|rack/.test(lower)) {
    return {
      role: locale === 'en' ? 'Logistics & Bay' : 'واحد تدارکات و انبار',
      zoneId: 'logistics',
      type: 'task',
      isBottleneck: false,
    };
  }
  return {
    role: locale === 'en' ? 'Intake Specialist' : 'کارشناس ثبت درخواست',
    zoneId: 'intake',
    type: 'task',
    isBottleneck: false,
  };
}

/**
 * Parses a pasted or uploaded company regulation (FA or EN) into structured
 * BPMN 2.0 flow nodes, RACI responsibility matrix, and dynamic 3D zone labels.
 */
export function analyzeRegulationDocument(
  rawText: string,
  locale: Locale = 'fa'
): DocumentAnalysisResult {
  const trimmed = rawText.trim();
  if (trimmed.length < 10) {
    throw new Error(
      locale === 'en'
        ? 'Please enter a regulation or SOP text (at least 10 characters).'
        : 'لطفاً متن آیین‌نامه یا دستورالعمل (حداقل ۱۰ کاراکتر) را وارد نمایید.'
    );
  }

  const rawLines = trimmed
    .split(/[\n\r]+|(?<=[.؟!])\s+/)
    .map((l) => l.trim())
    .filter((l) => l.length >= 8)
    .slice(0, 6);

  const clauses = rawLines.length > 0 ? rawLines : [trimmed];

  const bpmnNodes: BpmnNode[] = [
    {
      id: 'bpmn-start',
      type: 'start',
      label: locale === 'en' ? 'Start Event' : 'شروع فرآیند',
      role: locale === 'en' ? 'Requesting Unit' : 'واحد متقاضی',
      zoneId: 'intake',
    },
  ];

  const raciMatrix: RaciRow[] = [];
  let detectedBottlenecks = 0;

  let intakeTitle = locale === 'en' ? 'Request & Intake' : 'ثبت و ورود درخواست';
  let approvalAsIsTitle = locale === 'en' ? 'Manual Review...' : 'در حال بررسی دستی...';
  let approvalToBeTitle = locale === 'en' ? 'AI Auto-Approval' : 'تایید خودکار با AI';
  let logisticsTitle = locale === 'en' ? 'Fast Logistics Active' : 'تدارکات سریع فعال است';

  clauses.forEach((clause, idx) => {
    const inferred = inferStepRoleAndZone(clause, locale);
    const fallback = locale === 'en' ? `Activity ${idx + 1}` : `فعالیت ${idx + 1}`;
    const label = summarizeStepLabel(clause, fallback);
    const shortZone = compactZoneLabel(clause, label);
    if (inferred.isBottleneck) detectedBottlenecks++;

    if (inferred.zoneId === 'intake' && idx === 0) {
      intakeTitle = shortZone;
    } else if (inferred.zoneId === 'approval') {
      approvalAsIsTitle = shortZone;
    } else if (inferred.zoneId === 'ai_core') {
      approvalToBeTitle = shortZone;
    } else if (inferred.zoneId === 'logistics') {
      logisticsTitle = shortZone;
    }

    bpmnNodes.push({
      id: `bpmn-step-${idx + 1}`,
      type: inferred.type,
      label,
      role: inferred.role,
      zoneId: inferred.zoneId,
      isBottleneck: inferred.isBottleneck,
    });

    raciMatrix.push({
      activity: label,
      intakeSpecialist:
        inferred.zoneId === 'intake' ? 'R' : inferred.zoneId === 'logistics' ? 'I' : 'C',
      departmentManager:
        inferred.zoneId === 'approval' ? 'A' : inferred.zoneId === 'intake' ? 'I' : 'C',
      aiEngine:
        inferred.zoneId === 'ai_core' || inferred.zoneId === 'approval' ? 'R' : 'C',
      procurementTeam:
        inferred.zoneId === 'logistics' ? 'R' : inferred.zoneId === 'approval' ? 'I' : '—',
    });
  });

  bpmnNodes.push({
    id: 'bpmn-end',
    type: 'end',
    label: locale === 'en' ? 'Completed & Dispatched' : 'تکمیل و تحویل نهایی',
    role: locale === 'en' ? 'Logistics Bay' : 'لجستیک و انبار',
    zoneId: 'logistics',
  });

  const lower = trimmed.toLowerCase();
  let processTitle =
    locale === 'en' ? 'Extracted Enterprise Process' : 'فرآیند استخراج‌شده از آیین‌نامه';
  if (/قطعه|تعمیرات|سرپرست نت|spare|maintenance|reliability/.test(lower)) {
    processTitle =
      locale === 'en'
        ? 'Critical Spare Parts & Maintenance Workflow'
        : 'فرآیند تعمیرات و تأمین قطعات یدکی';
  } else if (/فروش|مشتری|حواله|پیش‌فاکتور|sales|customer|order/.test(lower)) {
    processTitle =
      locale === 'en'
        ? 'Commercial Order Fulfillment Workflow'
        : 'فرآیند صدور حواله و تحویل سفارش فروش';
  } else if (/خرید|تدارکات|کالا|procurement|requisition|purchase/.test(lower)) {
    processTitle =
      locale === 'en'
        ? 'Intelligent Refinery Procurement Process'
        : 'فرآیند خرید و تدارکات هوشمند سازمانی';
  }

  const effectiveBottlenecks = Math.max(1, detectedBottlenecks);

  return {
    processTitle,
    summary:
      locale === 'en'
        ? `Extracted ${clauses.length} key tasks and ${effectiveBottlenecks} approval bottleneck(s) into a live BPMN 2.0 model.`
        : `${clauses.length} گام کلیدی و ${effectiveBottlenecks} گلوگاه تایید از متن آیین‌نامه استخراج و به مدل BPMN 2.0 تبدیل شد.`,
    extractedStepsCount: clauses.length,
    detectedBottlenecks: effectiveBottlenecks,
    estimatedTimeReduction:
      locale === 'en'
        ? effectiveBottlenecks >= 2
          ? '92% cycle reduction'
          : '86% cycle reduction'
        : effectiveBottlenecks >= 2
          ? '۹۲٪ کاهش زمان چرخه'
          : '۸۶٪ کاهش زمان چرخه',
    bpmnNodes,
    raciMatrix,
    zoneLabels: {
      processTitle,
      intakeLabel: intakeTitle,
      approvalAsIsLabel: approvalAsIsTitle,
      approvalToBeLabel: approvalToBeTitle,
      logisticsLabel: logisticsTitle,
    },
  };
}

/**
 * Generates an AI-assisted CAPA plan localized in FA or EN for any ISO/EFQM nonconformity.
 */
export function generateCapaForClause(
  clause: ComplianceClause,
  locale: Locale = 'fa'
): CapaPlan {
  if (locale === 'en') {
    switch (clause.id) {
      case 'iso-4-4':
        return {
          rootCause: 'Reliance on physical signatures for standard requisitions without threshold-based delegation.',
          correctiveAction: 'Enforce 2-hour SLA thresholds, activate AI policy routing for standard orders, and enable automated escalation.',
          owner: 'BPMO & Operations Director',
          targetDays: 14,
          maturityGain: 4,
        };
      case 'iso-6-1':
        return {
          rootCause: 'Missing mandatory validation rules for material SKU codes and cost-center balances at intake.',
          correctiveAction: 'Deploy real-time ERP & warehouse API validation directly inside the intake workstation form.',
          owner: 'Supply Planning & IT Systems',
          targetDays: 10,
          maturityGain: 4,
        };
      case 'efqm-4':
        return {
          rootCause: 'Legacy semi-manual approval routing disconnected from mechanized logistics bay scheduling.',
          correctiveAction: 'Transition active workflow to TO-BE AI mode and link AI Core approvals directly to conveyor dispatch.',
          owner: 'Digital Transformation Committee',
          targetDays: 21,
          maturityGain: 5,
        };
      default:
        return {
          rootCause: `Process deviation identified under ${clause.clauseCode} (${clause.standard}).`,
          correctiveAction: 'Update SOP governance, automate intermediate checks, and enforce live KPI telemetry.',
          owner: 'Process Owner',
          targetDays: 15,
          maturityGain: 4,
        };
    }
  }

  switch (clause.id) {
    case 'iso-4-4':
      return {
        rootCause: 'وابستگی تاییدات استاندارد به امضای فیزیکی و نبود تفویض اختیار سیستمی زیر سقف مجاز.',
        correctiveAction: 'تعریف SLA حداکثر ۲ ساعته، فعال‌سازی موتور قواعد AI برای خریدهای استاندارد و هشدار خودکار تشدید.',
        owner: 'دفتر مدیریت فرآیند و معاونت اجرایی',
        targetDays: 14,
        maturityGain: 4,
      };
    case 'iso-6-1':
      return {
        rootCause: 'نبود فیلدهای اجباری و کنترل هوشمند کد کالا و اعتبار بودجه هنگام ثبت اولیه درخواست.',
        correctiveAction: 'پیاده‌سازی اعتبارسنجی لحظه‌ای فرم ثبت درخواست متصل به سیستم انبار و بودجه.',
        owner: 'واحد برنامه‌ریزی تأمین و فناوری اطلاعات',
        targetDays: 10,
        maturityGain: 4,
      };
    case 'efqm-4':
      return {
        rootCause: 'تداوم گردش کار نیمه‌کاغذی در ایستگاه تایید میانی و عدم یکپارچگی با نوار نقاله لجستیک.',
        correctiveAction: 'انتقال کامل جریان به حالت بهینه‌شده TO-BE و اتصال API مستقیم بین AI Core و انبار مکانیزه.',
        owner: 'کمیته تحول دیجیتال',
        targetDays: 21,
        maturityGain: 5,
      };
    default:
      return {
        rootCause: `انحراف فرآیندی شناسایی‌شده در ${clause.clauseCode} (${clause.standard}).`,
        correctiveAction: 'به‌روزرسانی دستورالعمل اجرایی، خودکارسازی کنترل‌های میانی و پایش مستمر KPI.',
        owner: 'مالک فرآیند',
        targetDays: 15,
        maturityGain: 4,
      };
  }
}
