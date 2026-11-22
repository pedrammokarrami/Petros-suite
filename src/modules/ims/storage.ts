import {
  INITIAL_DOCUMENT_MAP,
  ISO_KNOWLEDGE_BASE,
  ISO_STANDARD_LIST,
} from '../../data/isoKnowledgeBase';
import { makeEvaluationKey, syncAutoCapaForEvaluation } from './calculations';
import type {
  AssetProcessEntity,
  ComplianceStatus,
  GapEvaluation,
  ImsCapaItem,
  ImsProjectState,
} from './types';

const DB_NAME = 'petros_ims_suite_db';
const DB_VERSION = 1;
const STORE_NAME = 'ims_projects';
const RECORD_KEY = 'active_project_v1';
const LOCAL_STORAGE_KEY = 'petros_ims_project_v1';

/**
 * Deterministic, realistic industrial seed state for a petrochemical/refinery facility.
 */
export function createDefaultImsState(): ImsProjectState {
  const today = '2026-11-22';

  // Seed realistic Gap Analysis statuses across Annex SL Clauses 4–10
  const evaluations: Record<string, GapEvaluation> = {};
  const presetStatusMap: Record<string, ComplianceStatus> = {
    '4.1::14001': 'compliant',
    '4.1::45001': 'compliant',
    '4.1::50001': 'in_progress',
    '4.1::55001': 'in_progress',
    '4.2::14001': 'compliant',
    '4.2::45001': 'compliant',
    '4.2::50001': 'compliant',
    '4.2::55001': 'minor_nc',
    '4.3::14001': 'compliant',
    '4.3::45001': 'compliant',
    '4.3::50001': 'compliant',
    '4.3::55001': 'compliant',
    '5.1::14001': 'compliant',
    '5.1::45001': 'compliant',
    '5.1::50001': 'in_progress',
    '5.1::55001': 'in_progress',
    '5.2::14001': 'compliant',
    '5.2::45001': 'compliant',
    '5.2::50001': 'compliant',
    '5.2::55001': 'compliant',
    '5.3::14001': 'compliant',
    '5.3::45001': 'in_progress',
    '5.3::50001': 'in_progress',
    '5.3::55001': 'minor_nc',
    '6.1::14001': 'compliant',
    '6.1::45001': 'minor_nc',
    '6.1::50001': 'major_nc',
    '6.1::55001': 'in_progress',
    '6.2::14001': 'compliant',
    '6.2::45001': 'compliant',
    '6.2::50001': 'in_progress',
    '6.2::55001': 'major_nc',
    '7.1::14001': 'compliant',
    '7.1::45001': 'compliant',
    '7.1::50001': 'minor_nc',
    '7.1::55001': 'in_progress',
    '7.2::14001': 'compliant',
    '7.2::45001': 'compliant',
    '7.2::50001': 'in_progress',
    '7.2::55001': 'compliant',
    '7.4::14001': 'compliant',
    '7.4::45001': 'compliant',
    '7.4::50001': 'in_progress',
    '7.4::55001': 'minor_nc',
    '8.1::14001': 'minor_nc',
    '8.1::45001': 'compliant',
    '8.1::50001': 'in_progress',
    '8.1::55001': 'compliant',
    '8.2::14001': 'compliant',
    '8.2::45001': 'compliant',
    '8.2::50001': 'in_progress',
    '8.2::55001': 'in_progress',
    '9.1::14001': 'compliant',
    '9.1::45001': 'compliant',
    '9.1::50001': 'minor_nc',
    '9.1::55001': 'compliant',
    '9.2::14001': 'compliant',
    '9.2::45001': 'compliant',
    '9.2::50001': 'in_progress',
    '9.2::55001': 'in_progress',
    '9.3::14001': 'compliant',
    '9.3::45001': 'compliant',
    '9.3::50001': 'compliant',
    '9.3::55001': 'in_progress',
    '10.1::14001': 'compliant',
    '10.1::45001': 'compliant',
    '10.1::50001': 'in_progress',
    '10.1::55001': 'compliant',
    '10.3::14001': 'compliant',
    '10.3::45001': 'in_progress',
    '10.3::50001': 'minor_nc',
    '10.3::55001': 'in_progress',
  };

  const presetNotes: Record<string, string> = {
    '6.1::50001': 'خط مبنای انرژی (EnB) برای کمپرسورها نرمال‌سازی نشده و طرح جمع‌آوری داده تکمیل نیست.',
    '6.2::55001': 'برنامه‌های مدیریت دارایی (AMP) برای تجهیزات بحرانی واحد یوتیلیتی هنوز به SAMP متصل نشده‌اند.',
    '6.1::45001': 'ارزیابی ریسک HIRA برای فعالیت غیرروتین تعمیرات اساسی بویلر نیازمند بازنگری است.',
    '8.1::14001': 'معیارهای ارزیابی زیست‌محیطی پیمانکاران حمل پسماند ویژه در فرم ارزیابی جدید درج نشده است.',
    '7.1::50001': 'کنتور فرعی (Sub-meter) کمپرسور دوم در انتظار نصب و کالیبراسیون است.',
  };

  let capas: ImsCapaItem[] = [];

  for (const clause of ISO_KNOWLEDGE_BASE) {
    for (const std of ISO_STANDARD_LIST) {
      const key = makeEvaluationKey(clause.clauseNumber, std);
      const status = presetStatusMap[key] ?? 'in_progress';
      const evalObj: GapEvaluation = {
        key,
        clauseNumber: clause.clauseNumber,
        standard: std,
        status,
        notes: presetNotes[key] ?? '',
        evidenceLink: status === 'compliant' ? `DMS://${std}/CL-${clause.clauseNumber}` : '',
        updatedAt: today,
      };
      evaluations[key] = evalObj;
      if (status === 'minor_nc' || status === 'major_nc') {
        capas = syncAutoCapaForEvaluation(capas, evalObj, '2026-11-22T09:00:00Z');
      }
    }
  }

  // Signature Feature Seed: One Input, Four Dimensions (Asset & Process Hub)
  const assets: AssetProcessEntity[] = [
    {
      id: 'asset-c101',
      name: 'کمپرسور هوای ابزار دقیق (C-101)',
      code: 'EQ-UTL-C101',
      unit: 'واحد یوتیلیتی و هوای فشرده',
      entityType: 'asset',
      iso55001: {
        criticality: 'critical',
        consequence: 5,
        likelihood: 4,
        lifecycleStage: 'operate',
        maintenanceStrategy: 'pdm',
        replacementCostMillion: 18500,
      },
      iso50001: {
        isSeu: true,
        energyCarrier: 'برق (Electricity)',
        baselineEnb: 145000,
        actualConsumption: 132400,
        productionOutput: 1200,
        enpiUnit: 'kWh / هزار مترمکعب هوا',
      },
      iso45001: {
        primaryHazard: 'تراز صدای بالای ۹۲ دسی‌بل و خطر رهایش ناگهانی هوای پرفشار (۸ بار)',
        initialSeverity: 4,
        initialLikelihood: 4,
        controlsApplied: ['engineering', 'administrative', 'ppe'],
        controlDescription: 'اتاقک عایق صوتی، شیر اطمینان کالیبره، دستورالعمل LOTO و گوشی حفاظتی اجباری',
      },
      iso14001: {
        primaryAspect: 'تولید میعانات روغنی (Oily Condensate) و آلودگی صوتی محیط پیرامون',
        impactCategory: 'پساب صنعتی',
        severity: 4,
        probability: 4,
        legalFactor: 2,
        operationalControl: 'جداکننده آب و روغن (Oil-Water Separator) و پایش ماهانه خروجی',
      },
    },
    {
      id: 'asset-b204',
      name: 'بویلر بخار فشار بالا (B-204)',
      code: 'EQ-UTL-B204',
      unit: 'واحد بخار و نیروگاه',
      entityType: 'asset',
      iso55001: {
        criticality: 'critical',
        consequence: 5,
        likelihood: 3,
        lifecycleStage: 'maintain',
        maintenanceStrategy: 'rcm',
        replacementCostMillion: 42000,
      },
      iso50001: {
        isSeu: true,
        energyCarrier: 'گاز طبیعی (Natural Gas)',
        baselineEnb: 290000,
        actualConsumption: 268500,
        productionOutput: 9500,
        enpiUnit: 'GJ / تن بخار تولیدی',
      },
      iso45001: {
        primaryHazard: 'خطر انفجار محفظه احتراق، سوختگی حرارتی بخار ۴۰ بار و نشت گاز',
        initialSeverity: 5,
        initialLikelihood: 3,
        controlsApplied: ['engineering', 'administrative', 'ppe'],
        controlDescription: 'سیستم BMS ایمن، دتکتور نشت گاز، عایق حرارتی خطوط و مجوز کار گرم (PTW)',
      },
      iso14001: {
        primaryAspect: 'انتشار گازهای احتراقی NOx / CO2 از دودکش و پساب بلوداون حرارتی',
        impactCategory: 'آلودگی هوا',
        severity: 4,
        probability: 4,
        legalFactor: 3,
        operationalControl: 'تنظیم اکسیژن اضافی مشعل با آنالایزر آنلاین و خنک‌سازی بلوداون پیش از تخلیه',
      },
    },
    {
      id: 'asset-wwtp',
      name: 'واحد تصفیه پساب صنعتی (WWTP)',
      code: 'PR-ENV-WWTP',
      unit: 'واحد تصفیه و بازیافت آب',
      entityType: 'process',
      iso55001: {
        criticality: 'high',
        consequence: 4,
        likelihood: 3,
        lifecycleStage: 'operate',
        maintenanceStrategy: 'pm',
        replacementCostMillion: 26000,
      },
      iso50001: {
        isSeu: true,
        energyCarrier: 'برق (Electricity)',
        baselineEnb: 88000,
        actualConsumption: 91200,
        productionOutput: 42000,
        enpiUnit: 'kWh / مترمکعب پساب تصفیه‌شده',
      },
      iso45001: {
        primaryHazard: 'تماس با مواد شیمیایی خورنده (اسید/سود) و گاز سمی H2S در حوضچه‌ها',
        initialSeverity: 5,
        initialLikelihood: 3,
        controlsApplied: ['substitution', 'engineering', 'administrative', 'ppe'],
        controlDescription: 'گازسنج ثابت H2S، دوش و چشم‌شوی اضطراری، تهویه اجباری و ماسک تنفسی',
      },
      iso14001: {
        primaryAspect: 'ریسک تجاوز COD/BOD خروجی از حد مجاز محیط زیست و تولید لجن صنعتی',
        impactCategory: 'پساب صنعتی',
        severity: 5,
        probability: 3,
        legalFactor: 3,
        operationalControl: 'پایش آنلاین COD/pH، حوضچه تعدیل اضطراری و تحویل لجن به پیمانکار مجاز',
      },
    },
    {
      id: 'asset-chem',
      name: 'ایستگاه پمپاژ و انبار مواد شیمیایی',
      code: 'UN-LOG-CHEM',
      unit: 'لجستیک و انبار فنی',
      entityType: 'unit',
      iso55001: {
        criticality: 'medium',
        consequence: 3,
        likelihood: 2,
        lifecycleStage: 'operate',
        maintenanceStrategy: 'pm',
        replacementCostMillion: 6400,
      },
      iso50001: {
        isSeu: false,
        energyCarrier: 'برق (Electricity)',
        baselineEnb: 18500,
        actualConsumption: 17900,
        productionOutput: 650,
        enpiUnit: 'kWh / نوبت پمپاژ',
      },
      iso45001: {
        primaryHazard: 'پاشش حلال‌های شیمیایی هنگام تخلیه بشکه‌ها و بخارات قابل اشتعال',
        initialSeverity: 4,
        initialLikelihood: 3,
        controlsApplied: ['engineering', 'administrative', 'ppe'],
        controlDescription: 'پمپ ضدجرقه (ATEX)، ارتینگ بشکه‌ها، برگه MSDS و شیلد صورت و دستکش نیتریل',
      },
      iso14001: {
        primaryAspect: 'نشت احتمالی مواد شیمیایی به خاک و آب‌های سطحی هنگام جابه‌جایی',
        impactCategory: 'نشت و خاک',
        severity: 4,
        probability: 2,
        legalFactor: 3,
        operationalControl: 'پالت‌های ضدنشت (Secondary Containment 110%) و کیت مهار نشت اضطراری',
      },
    },
  ];

  return {
    version: 1,
    organizationName: 'مجتمع صنعتی و پالایشگاهی پتروس (Petros Industrial Complex)',
    lastUpdated: today,
    evaluations,
    capas,
    assets,
    environmentalAspects: [
      {
        id: 'asp-1',
        assetId: 'asset-b204',
        activityOrAsset: 'بویلر بخار فشار بالا (B-204)',
        aspect: 'انتشار گازهای NOx و CO2 از دودکش بویلر',
        impact: 'آلودگی هوا و افزایش انتشار گازهای گلخانه‌ای',
        condition: 'نرمال',
        severity: 4,
        probability: 4,
        legalFactor: 3,
        controlMeasure: 'آنالایزر آنلاین احتراق و پایش فصلی آزمایشگاه معتمد محیط زیست',
      },
      {
        id: 'asp-2',
        assetId: 'asset-wwtp',
        activityOrAsset: 'واحد تصفیه پساب صنعتی (WWTP)',
        aspect: 'تخلیه پساب تصفیه‌شده و مدیریت لجن بیولوژیک',
        impact: 'آلودگی منابع آب پذیرنده در صورت خروج COD از استاندارد',
        condition: 'غیرنرمال',
        severity: 5,
        probability: 3,
        legalFactor: 3,
        controlMeasure: 'حوضچه تعدیل اضطراری، سنسور آنلاین COD/pH و دفع مجاز لجن',
      },
      {
        id: 'asp-3',
        assetId: 'asset-c101',
        activityOrAsset: 'کمپرسور هوای ابزار دقیق (C-101)',
        aspect: 'تولید کندانس روغنی و تراز صدای محیطی',
        impact: 'آلودگی آب و نارضایتی صوتی در محیط کارخانه',
        condition: 'نرمال',
        severity: 3,
        probability: 4,
        legalFactor: 2,
        controlMeasure: 'سپراتور آب و روغن و محفظه آکوستیک کمپرسور',
      },
      {
        id: 'asp-4',
        assetId: 'asset-chem',
        activityOrAsset: 'ایستگاه پمپاژ و انبار مواد شیمیایی',
        aspect: 'نشت حلال و مواد شیمیایی هنگام تخلیه',
        impact: 'آلودگی خاک و آب‌های زیرزمینی',
        condition: 'اضطراری',
        severity: 4,
        probability: 2,
        legalFactor: 3,
        controlMeasure: 'کف‌سازی اپوکسی ضدنفوذ، دایک مهار ۱۱۰٪ و کیت مهار نشت',
      },
    ],
    legalRegister: [
      {
        id: 'leg-1',
        standard: '14001',
        regulationCode: 'ENV-STD-1399',
        title: 'استاندارد حدود مجاز خروجی پساب صنعتی و آلایندگی هوا (سازمان حفاظت محیط زیست)',
        authority: 'سازمان حفاظت محیط زیست',
        applicableUnit: 'تصفیه‌خانه و واحد بخار',
        complianceStatus: 'compliant',
        nextReviewDate: '2027-02-15',
      },
      {
        id: 'leg-2',
        standard: '45001',
        regulationCode: 'OHS-LAB-91',
        title: 'آیین‌نامه حفاظت فنی، ایمنی مخازن تحت فشار و کار در ارتفاع (ماده ۸۵ قانون کار)',
        authority: 'وزارت تعاون، کار و رفاه اجتماعی',
        applicableUnit: 'کلیه واحدهای عملیاتی و تعمیرات',
        complianceStatus: 'compliant',
        nextReviewDate: '2027-01-20',
      },
      {
        id: 'leg-3',
        standard: '50001',
        regulationCode: 'ENM-LAW-26',
        title: 'ماده ۲۶ قانون اصلاح الگوی مصرف انرژی — ممیزی انرژی صنایع انرژی‌بر',
        authority: 'ساتبا / شرکت بهینه‌سازی مصرف سوخت',
        applicableUnit: 'یوتیلیتی، بخار و کمپرسورها',
        complianceStatus: 'partial',
        nextReviewDate: '2026-12-30',
      },
      {
        id: 'leg-4',
        standard: '55001',
        regulationCode: 'AMS-INS-1404',
        title: 'الزامات بازرسی فنی سالانه دیگ‌های بخار و تجهیزات تحت فشار (استاندارد ملی)',
        authority: 'سازمان ملی استاندارد و شرکت‌های بازرسی مجاز',
        applicableUnit: 'واحد بخار و یوتیلیتی',
        complianceStatus: 'compliant',
        nextReviewDate: '2027-03-10',
      },
    ],
    hiraRisks: [
      {
        id: 'hira-1',
        assetId: 'asset-b204',
        activityOrAsset: 'بویلر بخار فشار بالا (B-204)',
        hazard: 'نشت گاز طبیعی و ریسک انفجار مشعل هنگام راه‌اندازی مجدد',
        consequence: 'جراحت شدید، سوختگی حرارتی و خسارت سنگین تجهیزاتی',
        initialSeverity: 5,
        initialLikelihood: 3,
        controlsApplied: ['engineering', 'administrative', 'ppe'],
        controlAction: 'اینترلاک سیستم BMS، پرج خودکار محفظه، دتکتور گاز و چک‌لیست راه‌اندازی',
        owner: 'سرپرست واحد بخار',
      },
      {
        id: 'hira-2',
        assetId: 'asset-wwtp',
        activityOrAsset: 'واحد تصفیه پساب صنعتی (WWTP)',
        hazard: 'استنشاق گاز H2S و تماس پوستی با اسید سولفوریک در ایستگاه تزریق',
        consequence: 'مسمومیت تنفسی حاد و سوختگی شیمیایی',
        initialSeverity: 5,
        initialLikelihood: 4,
        controlsApplied: ['substitution', 'engineering', 'administrative', 'ppe'],
        controlAction: 'پمپ تزریق بسته، سنسور H2S با آلارم، دوش اضطراری و ماسک فیلتردار',
        owner: 'سرپرست HSE',
      },
      {
        id: 'hira-3',
        assetId: 'asset-c101',
        activityOrAsset: 'کمپرسور هوای ابزار دقیق (C-101)',
        hazard: 'مواجهه طولانی‌مدت با صدای ۹۲ دسی‌بل و سرویس بدون تخلیه فشار',
        consequence: 'افت شنوایی شغلی و آسیب مکانیکی ناشی از هوای پرفشار',
        initialSeverity: 4,
        initialLikelihood: 4,
        controlsApplied: ['engineering', 'administrative', 'ppe'],
        controlAction: 'عایق آکوستیک، اجرای سخت‌گیرانه LOTO و استفاده از گوشی حفاظتی',
        owner: 'سرپرست تعمیرات مکانیک',
      },
    ],
    energyConsumers: [
      {
        id: 'en-1',
        assetId: 'asset-b204',
        consumerName: 'بویلر بخار فشار بالا (B-204)',
        unit: 'واحد بخار',
        carrier: 'گاز طبیعی (Natural Gas)',
        isSeu: true,
        enbBaseline: 2900,
        actualEnergy: 2685,
        outputVolume: 950,
        outputUnit: 'تن بخار',
        targetReductionPct: 8,
      },
      {
        id: 'en-2',
        assetId: 'asset-c101',
        consumerName: 'کمپرسور هوای ابزار دقیق (C-101)',
        unit: 'یوتیلیتی',
        carrier: 'برق (Electricity)',
        isSeu: true,
        enbBaseline: 1450,
        actualEnergy: 1324,
        outputVolume: 1200,
        outputUnit: 'هزار مترمکعب هوا',
        targetReductionPct: 10,
      },
      {
        id: 'en-3',
        assetId: 'asset-wwtp',
        consumerName: 'هوادهی و پمپ‌های تصفیه‌خانه (WWTP)',
        unit: 'تصفیه پساب',
        carrier: 'برق (Electricity)',
        isSeu: true,
        enbBaseline: 880,
        actualEnergy: 912,
        outputVolume: 420,
        outputUnit: 'صد مترمکعب پساب',
        targetReductionPct: 6,
      },
      {
        id: 'en-4',
        assetId: 'asset-chem',
        consumerName: 'ایستگاه پمپاژ و روشنایی انبار شیمیایی',
        unit: 'لجستیک',
        carrier: 'برق (Electricity)',
        isSeu: false,
        enbBaseline: 185,
        actualEnergy: 179,
        outputVolume: 65,
        outputUnit: 'نوبت پمپاژ',
        targetReductionPct: 5,
      },
    ],
    samp: {
      organizationMission:
        'تضمین پایداری تولید بدون حادثه با بیشینه دسترس‌پذیری تجهیزات بحرانی، حداقل شدت مصرف انرژی و انطباق کامل زیست‌محیطی در افق ۵ ساله.',
      planningHorizon: 'افق ۵ ساله (۱۴۰۵ تا ۱۴۱۰) با بازنگری سالانه هم‌زمان با بودجه‌بندی',
      assetObjectives:
        '۱) دستیابی به دسترس‌پذیری ≥ ۹۸.۵٪ در تجهیزات Tier 1 (بویلر و کمپرسورها)\n۲) کاهش ۱۸٪ هزینه‌های تعمیرات اضطراری از طریق گذار به نگهداری پیش‌گویانه (PdM)\n۳) کاهش ۱۰٪ شدت انرژی (EnPI) تجهیزات پرمصرف (SEU)',
      criticalityPolicy:
        'تمامی دارایی‌ها بر مبنای ماتریس ۵×۵ (پیامد ایمنی/محیط زیست/تولید × احتمال خرابی) رتبه‌بندی شده و تجهیزات با امتیاز ۱۶ به بالا تحت پایش آنلاین وضعیت (CBM) و استراتژی RCM قرار می‌گیرند.',
      lifecycleFundingStrategy:
        'تخصیص ۶۵٪ بودجه CAPEX به نوسازی و تجهیز ابزارهای پایش آنلاین تجهیزات Tier 1/2 و ارزیابی تمامی خریدهای جدید بر اساس هزینه کل چرخه عمر (LCC) شامل مصرف انرژی.',
      riskAndResilienceApproach:
        'حذف تک‌نقاط شکست (Single Points of Failure) با نگهداری قطعات یدکی حیاتی، اجرای اجباری RCFA برای هر توقف بالای ۴ ساعت و یکپارچه‌سازی با طرح‌های اضطراری HSE.',
      kpiMetrics:
        'MTBF ≥ 1400 ساعت · MTTR ≤ 4.5 ساعت · نسبت نت برنامه‌ریزی‌شده ≥ ۸۵٪ · انحراف هزینه نت به ارزش جایگزینی ≤ ۲.۸٪',
      reviewCycle: 'بازنگری سالانه در جلسه بازنگری مدیریت (بند ۹.۳) یا پس از هر تغییر راهبردی تولید',
    },
    documents: INITIAL_DOCUMENT_MAP.map((d) => ({ ...d })),
  };
}

function openImsDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IDB open error'));
  });
}

/**
 * Loads persisted IMS project state from IndexedDB (primary) with seamless localStorage fallback.
 */
export async function loadImsProjectState(): Promise<ImsProjectState> {
  try {
    const db = await openImsDb();
    const record = await new Promise<ImsProjectState | undefined>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(RECORD_KEY);
      req.onsuccess = () => resolve(req.result as ImsProjectState | undefined);
      req.onerror = () => reject(req.error);
    });
    db.close();
    if (record && typeof record === 'object' && record.evaluations && record.assets) {
      return record;
    }
  } catch {
    // Fallback to localStorage below
  }

  try {
    const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as ImsProjectState;
      if (parsed && parsed.evaluations && parsed.assets) {
        return parsed;
      }
    }
  } catch {
    // Ignore storage read failure
  }

  return createDefaultImsState();
}

/**
 * Persists IMS project state cleanly to both IndexedDB and localStorage so zero data is lost.
 */
export async function saveImsProjectState(state: ImsProjectState): Promise<void> {
  try {
    window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors on localStorage when IndexedDB is primary
  }

  try {
    const db = await openImsDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(state, RECORD_KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    // localStorage copy remains intact
  }
}
