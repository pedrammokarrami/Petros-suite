import type {
  CameraFocusPreset,
  ComplianceClause,
  MaturityDimension,
  ProcessArchNode,
  StationProfile360,
  ZoneFocusId,
} from './types';

export const CAMERA_PRESETS: Record<ZoneFocusId, CameraFocusPreset> = {
  overview: {
    id: 'overview',
    label: 'نمای کل زنجیره ارزش',
    target: [0, 0.15, 0],
    zoomDesktop: 52,
    zoomMobile: 25,
  },
  intake: {
    id: 'intake',
    label: 'ایستگاه درخواست و ثبت',
    target: [-6.0, 0.45, 0.0],
    zoomDesktop: 92,
    zoomMobile: 52,
  },
  approval: {
    id: 'approval',
    label: 'ایستگاه تایید مدیریت',
    target: [0.2, 0.45, 1.45],
    zoomDesktop: 90,
    zoomMobile: 52,
  },
  ai_core: {
    id: 'ai_core',
    label: 'هسته هوش مصنوعی (AI Core)',
    target: [0.0, 0.65, -1.45],
    zoomDesktop: 96,
    zoomMobile: 55,
  },
  logistics: {
    id: 'logistics',
    label: 'ایستگاه تدارکات و انبار',
    target: [6.0, 0.45, 0.15],
    zoomDesktop: 90,
    zoomMobile: 52,
  },
};

export const PROCESS_ARCHITECTURE_TREE: ProcessArchNode[] = [
  {
    id: 'l0-value-chain',
    level: 0,
    code: 'L0',
    title: 'سطح ۰: زنجیره ارزش کل سازمان',
    owner: 'دفتر مدیریت فرآیند (BPMO)',
    zoneId: 'overview',
    status: 'healthy',
    children: [
      {
        id: 'l1-procurement',
        level: 1,
        code: 'L1.1',
        title: 'سطح ۱: فرآیند اصلی تأمین و تدارکات',
        owner: 'معاونت زنجیره تأمین',
        zoneId: 'intake',
        status: 'bottleneck',
        children: [
          {
            id: 'l2-requisition',
            level: 2,
            code: 'L2.1',
            title: 'سطح ۲: ثبت و اعتبارسنجی درخواست خرید',
            owner: 'واحد برنامه‌ریزی نیازها',
            zoneId: 'intake',
            status: 'healthy',
            children: [
              {
                id: 'l3-intake-form',
                level: 3,
                code: 'L3.1.1',
                title: 'سطح ۳: تکمیل فرم تقاضای کالا و کدینگ',
                owner: 'کارشناس ثبت درخواست',
                zoneId: 'intake',
                status: 'healthy',
              },
              {
                id: 'l3-budget-check',
                level: 3,
                code: 'L3.1.2',
                title: 'سطح ۳: کنترل اولیه بودجه و موجودی',
                owner: 'کارشناس ثبت درخواست',
                zoneId: 'intake',
                status: 'optimized',
              },
            ],
          },
          {
            id: 'l2-approval-hub',
            level: 2,
            code: 'L2.2',
            title: 'سطح ۲: تاییدات مدیریتی و ریسک مالی',
            owner: 'مدیریت اجرایی / موتور AI',
            zoneId: 'approval',
            status: 'bottleneck',
            children: [
              {
                id: 'l3-manual-sign',
                level: 3,
                code: 'L3.2.1',
                title: 'سطح ۳: بررسی و امضای دستی مدیر واحد (گلوگاه)',
                owner: 'مدیر واحد اجرایی',
                zoneId: 'approval',
                status: 'bottleneck',
              },
              {
                id: 'l3-ai-policy',
                level: 3,
                code: 'L3.2.2',
                title: 'سطح ۳: ممیزی خودکار قواعد و تایید هوشمند AI',
                owner: 'هسته هوش مصنوعی پتروس',
                zoneId: 'ai_core',
                status: 'optimized',
              },
            ],
          },
        ],
      },
      {
        id: 'l1-production',
        level: 1,
        code: 'L1.2',
        title: 'سطح ۱: فرآیند اصلی تولید و عملیات',
        owner: 'مدیریت عملیات و لجستیک',
        zoneId: 'logistics',
        status: 'optimized',
        children: [
          {
            id: 'l2-warehouse',
            level: 2,
            code: 'L2.3',
            title: 'سطح ۲: تدارکات، انبارش و ارسال مکانیزه',
            owner: 'سرپرست لجستیک و انبار',
            zoneId: 'logistics',
            status: 'healthy',
            children: [
              {
                id: 'l3-conveyor-sort',
                level: 3,
                code: 'L3.3.1',
                title: 'سطح ۳: اسکن بارکد و هدایت روی نوار نقاله',
                owner: 'مسئول لجستیک',
                zoneId: 'logistics',
                status: 'optimized',
              },
              {
                id: 'l3-dispatch',
                level: 3,
                code: 'L3.3.2',
                title: 'سطح ۳: چیدمان قفسه و صدور حواله خروج',
                owner: 'مسئول انبار',
                zoneId: 'logistics',
                status: 'healthy',
              },
            ],
          },
        ],
      },
      {
        id: 'l1-sales',
        level: 1,
        code: 'L1.3',
        title: 'سطح ۱: فرآیند اصلی فروش و تحویل مشتری',
        owner: 'معاونت بازرگانی',
        zoneId: 'logistics',
        status: 'healthy',
        children: [
          {
            id: 'l2-fulfillment',
            level: 2,
            code: 'L2.4',
            title: 'سطح ۲: تحویل سفارش و پایش SLA مشتری',
            owner: 'واحد عملیات فروش',
            zoneId: 'logistics',
            status: 'optimized',
          },
        ],
      },
    ],
  },
];

// Exact baseline weighted average: (90 + 80 + 65 + 70 + 40) / 5 = 69?
// Let's use explicit weights so baseline AS-IS overall maturity is strictly 66%:
// 90*0.18 + 80*0.18 + 65*0.20 + 70*0.14 + 40*0.30 = 16.2 + 14.4 + 13 + 9.8 + 12 = 65.4 -> wait:
// 90*0.15 + 80*0.20 + 65*0.20 + 70*0.15 + 40*0.30 = 13.5 + 16 + 13 + 10.5 + 12 = 65
// 90*0.20 + 80*0.15 + 65*0.20 + 70*0.15 + 40*0.30 = 18 + 12 + 13 + 10.5 + 12 = 65.5 -> Math.round = 66%!
export const MATURITY_DIMENSIONS: MaturityDimension[] = [
  { key: 'owner', label: 'مالک فرآیند', baseScore: 90, toBeBonus: 5 },
  { key: 'documentation', label: 'مستندسازی', baseScore: 80, toBeBonus: 12 },
  { key: 'kpi', label: 'شاخص‌های عملکرد (KPI)', baseScore: 65, toBeBonus: 25 },
  { key: 'risk', label: 'کنترل ریسک', baseScore: 70, toBeBonus: 20 },
  { key: 'digitalization', label: 'دیجیتالی‌شدن', baseScore: 40, toBeBonus: 52 },
];

export const MATURITY_WEIGHTS: Record<MaturityDimension['key'], number> = {
  owner: 0.2,
  documentation: 0.15,
  kpi: 0.2,
  risk: 0.15,
  digitalization: 0.3,
};

export const STATION_PROFILES_360: Record<
  Exclude<ZoneFocusId, 'overview'>,
  StationProfile360
> = {
  intake: {
    zoneId: 'intake',
    title: 'ایستگاه درخواست و ثبت',
    roleTitle: 'کارشناس ثبت تقاضا و کدینگ کالا',
    ownerName: 'واحد برنامه‌ریزی تأمین',
    slaTarget: '۱۵ دقیقه',
    currentCycle: '۴۵ دقیقه',
    toBeCycle: '۳ دقیقه',
    aiRecommendations: [
      'فعال‌سازی تکمیل خودکار فرم بر اساس تاریخچه خرید (کاهش ۶۵٪ خطای ورود داده)',
      'اعتبارسنجی لحظه‌ای کد کالا و سقف بودجه پیش از ارسال به مرحله تایید',
    ],
    wastes: [
      {
        id: 'w-intake-1',
        title: 'دوباره‌کاری در ثبت دستی مشخصات فنی',
        wasteType: 'پردازش اضافی (Over-processing)',
        impactMinutes: 24,
        description: 'ورود مجدد اطلاعات فاکتورها در فرم‌های جداگانه اکسل و ERP.',
        eliminatedInToBe: true,
      },
      {
        id: 'w-intake-2',
        title: 'انتظار برای استعلام تلفنی موجودی انبار',
        wasteType: 'انتظار (Waiting)',
        impactMinutes: 18,
        description: 'عدم اتصال مستقیم فرم ثبت درخواست به موجودی لحظه‌ای قفسه‌های انبار.',
        eliminatedInToBe: true,
      },
    ],
  },
  approval: {
    zoneId: 'approval',
    title: 'ایستگاه تایید مدیریت (گلوگاه سنتی)',
    roleTitle: 'مدیر واحد اجرایی و تاییدات مالی',
    ownerName: 'معاونت اجرایی',
    slaTarget: '۴ ساعت',
    currentCycle: '۳.۸ روز',
    toBeCycle: 'حذف‌شده (خودکار)',
    aiRecommendations: [
      'تفویض تایید خریدهای زیر سقف مصوب به موتور قواعد هوشمند (AI Core)',
      'حذف زنجیره ۳ امضای تکراری و جایگزینی با ممیزی ریسک خودکار',
      'راه‌اندازی هشدار پیش‌دستانه SLA برای جلوگیری از انباشت صف انتظار',
    ],
    wastes: [
      {
        id: 'w-app-1',
        title: 'تجمع درخواست‌ها در صف امضای دستی مدیر',
        wasteType: 'انتظار و گلوگاه (Waiting / Bottleneck)',
        impactMinutes: 4620,
        description: 'بیش از ۷۸٪ زمان کل چرخه فرآیند صرف انتظار پرونده‌ها روی میز مدیر می‌شود.',
        eliminatedInToBe: true,
      },
      {
        id: 'w-app-2',
        title: 'تاییدات تکراری و بدون ارزش افزوده (NVA)',
        wasteType: 'حرکت و تایید زائد (Non-Value-Added)',
        impactMinutes: 410,
        description: 'بازبینی مجدد درخواست‌های استاندارد زیر ۵۰ میلیون تومان که پیش‌تر بودجه مصوب دارند.',
        eliminatedInToBe: true,
      },
    ],
  },
  ai_core: {
    zoneId: 'ai_core',
    title: 'هسته تصمیم‌ساز هوش مصنوعی (AI Core)',
    roleTitle: 'موتور قواعد، کنترل بودجه و تشخیص ناهنجاری',
    ownerName: 'تحول دیجیتال و هوش مصنوعی',
    slaTarget: '۱۰ ثانیه',
    currentCycle: 'غیرفعال در AS-IS',
    toBeCycle: '۸ ثانیه',
    aiRecommendations: [
      'گسترش یادگیری مدل به پیش‌بینی خودکار نقطه سفارش (Reorder Point)',
      'اتصال مستقیم لاگ تصمیمات AI به داشبورد ممیزی ISO 9001',
    ],
    wastes: [
      {
        id: 'w-ai-1',
        title: 'عدم بهره‌برداری از اتوماسیون در حالت سنتی',
        wasteType: 'ظرفیت بلااستفاده (Unused Talent / Tech)',
        impactMinutes: 5100,
        description: 'موتور تحلیل آماده است اما در حالت AS-IS پرونده‌ها از مسیر کاغذی عبور می‌کنند.',
        eliminatedInToBe: true,
      },
    ],
  },
  logistics: {
    zoneId: 'logistics',
    title: 'ایستگاه تدارکات، انبار و لجستیک',
    roleTitle: 'سرپرست انبار مکانیزه و ارسال',
    ownerName: 'مدیریت لجستیک',
    slaTarget: '۳۰ دقیقه',
    currentCycle: '۷ ساعت (با توقف نوار)',
    toBeCycle: '۸ دقیقه',
    aiRecommendations: [
      'همگام‌سازی سرعت نوار نقاله با پیش‌بینی ورود سفارش‌های تاییدشده توسط AI',
      'بهینه‌سازی چیدمان قفسه‌های پرتکرار (ABC Slotting) برای کاهش مسیر تردد',
    ],
    wastes: [
      {
        id: 'w-log-1',
        title: 'توقف و نوسان بار کاری نوار نقاله',
        wasteType: 'عدم توازن جریان (Uneven Flow / Mura)',
        impactMinutes: 195,
        description: 'به دلیل رهاسازی ناگهانی پرونده‌ها از میز مدیر، انبار دچار بیکاری و سپس ازدحام می‌شود.',
        eliminatedInToBe: true,
      },
    ],
  },
};

export const INITIAL_COMPLIANCE_CLAUSES: ComplianceClause[] = [
  {
    id: 'iso-4-4',
    standard: 'ISO 9001:2015',
    clauseCode: 'بند ۴.۴',
    title: 'تعامل فرآیندها و شاخص‌های پایش جریان',
    linkedZone: 'approval',
    status: 'nonconformity',
    finding: 'عدم وجود زمان استاندارد (SLA) الزام‌آور در ایستگاه تایید مدیریت و بروز گلوگاه انباشته.',
  },
  {
    id: 'iso-8-4',
    standard: 'ISO 9001:2015',
    clauseCode: 'بند ۸.۴',
    title: 'کنترل فرآیندها، محصولات و خدمات تأمین بیرونی',
    linkedZone: 'logistics',
    status: 'compliant',
    finding: 'ثبت بارکد و ردیابی ورودی کالا در نوار نقاله و قفسه‌های انبار منطبق با الزامات است.',
  },
  {
    id: 'iso-6-1',
    standard: 'ISO 9001:2015',
    clauseCode: 'بند ۶.۱',
    title: 'اقدامات برای رسیدگی به ریسک‌ها و فرصت‌ها',
    linkedZone: 'intake',
    status: 'nonconformity',
    finding: 'ریسک ثبت دستی ناقص درخواست‌های خرید بدون اعتبارسنجی سیستمی شناسایی شده است.',
  },
  {
    id: 'efqm-4',
    standard: 'EFQM 2025',
    clauseCode: 'معیار ۴',
    title: 'ایجاد ارزش پایدار و چابکی عملیاتی',
    linkedZone: 'ai_core',
    status: 'nonconformity',
    finding: 'نرخ دیجیتالی‌شدن فرآیند (۴۰٪) پایین‌تر از هدف تعالی سازمانی (۸۵٪) قرار دارد.',
  },
  {
    id: 'efqm-5',
    standard: 'EFQM 2025',
    clauseCode: 'معیار ۵',
    title: 'هدایت عملکرد و تحول مبتنی بر داده',
    linkedZone: 'logistics',
    status: 'compliant',
    finding: 'پایش لحظه‌ای نرخ تکمیل سفارش‌ها و بهره‌وری کل فرآیند در داشبورد فعال است.',
  },
];

export interface SampleRegulation {
  id: string;
  title: string;
  text: string;
}

export const SAMPLE_REGULATIONS: SampleRegulation[] = [
  {
    id: 'reg-procurement',
    title: 'آیین‌نامه خرید و تدارکات کالا',
    text: `ماده ۱: واحد متقاضی فرم درخواست خرید کالا را به همراه مشخصات فنی در سامانه ثبت می‌نماید.
ماده ۲: کارشناس کنترل بودجه موجودی انبار و اعتبار مصوب ردیف مالی را بررسی می‌کند.
ماده ۳: تمامی درخواست‌ها برای بررسی دستی و امضای مدیر واحد و سپس کمیته خرید ارسال می‌شود که در صورت تراکم باعث تأخیر در تایید می‌گردد.
ماده ۴: در صورت تایید هوشمند قواعد مالی توسط هسته هوش مصنوعی، سفارش خرید به‌صورت خودکار صادر می‌شود.
ماده ۵: واحد تدارکات و انبار کالا را دریافت، بارکدگذاری و از طریق نوار نقاله به واحد متقاضی تحویل می‌دهد.`,
  },
  {
    id: 'reg-maintenance',
    title: 'دستورالعمل تعمیرات و تأمین قطعات یدکی',
    text: `بند ۱: تکنسین خط تولید درخواست قطعه یدکی اضطراری را در سیستم ثبت می‌کند.
بند ۲: سرپرست نت نوع قطعه و اولویت توقف خط را اعتبارسنجی می‌نماید.
بند ۳: مدیر فنی درخواست را به‌صورت دستی بررسی و تایید مالی می‌کند (نقطه تصمیم و گلوگاه).
بند ۴: انبار فنی قطعه را از قفسه‌های استاندارد برداشت و روی خط تحویل مکانیزه ارسال می‌کند.`,
  },
  {
    id: 'reg-export',
    title: 'آیین‌نامه صدور حواله و ارسال سفارش فروش',
    text: `ماده ۱: کارشناس فروش سفارش مشتری را ثبت و اعتبارسنجی حسابداری انجام می‌دهد.
ماده ۲: مدیریت بازرگانی پیش‌فاکتور و تخفیف‌ها را به‌صورت دستی تایید می‌نماید.
ماده ۳: واحد لجستیک بسته‌بندی، اسکن بارکد و ارسال محموله از انبار مرکزی را اجرا می‌کند.`,
  },
];
