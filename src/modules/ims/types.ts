export type IsoStandardCode = '14001' | '45001' | '50001' | '55001';

export type DocumentLayer =
  | 'policy_strategy'
  | 'procedure'
  | 'work_instruction'
  | 'record_form';

export type ComplianceStatus =
  | 'compliant'
  | 'in_progress'
  | 'minor_nc'
  | 'major_nc'
  | 'na';

export type CapaStatus = 'open' | 'in_progress' | 'verified';

export type DocumentStatus = 'available' | 'needs_review' | 'missing';

export type CriticalityLevel = 'critical' | 'high' | 'medium' | 'low';

export type LifecycleStage =
  | 'design_acquire'
  | 'operate'
  | 'maintain'
  | 'renew_dispose';

export type MaintenanceStrategy = 'pdm' | 'pm' | 'rcm' | 'cm';

export type ControlHierarchyLevel =
  | 'elimination'
  | 'substitution'
  | 'engineering'
  | 'administrative'
  | 'ppe';

export interface StandardClauseDetail {
  focusTitle: string;
  requirementSummary: string;
  mandatoryDocumentedInfo: boolean;
  documentCategory?: DocumentLayer;
  documentHint?: string;
  auditQuestions: string[];
}

export interface AnnexSlClause {
  clauseNumber: string; // e.g., "4.1", "6.1", "8.1"
  parentClause: number; // 4..10
  parentTitle: string;
  title: string;
  commonSummary: string;
  standards: Record<IsoStandardCode, StandardClauseDetail>;
}

export interface GapEvaluation {
  key: string; // `${clauseNumber}::${standard}`
  clauseNumber: string;
  standard: IsoStandardCode;
  status: ComplianceStatus;
  notes: string;
  evidenceLink: string;
  updatedAt: string;
}

export interface ImsCapaItem {
  id: string;
  sourceEvaluationKey?: string;
  clauseNumber: string;
  standard: IsoStandardCode;
  severity: 'minor_nc' | 'major_nc';
  title: string;
  rootCause: string;
  correctiveAction: string;
  owner: string;
  deadline: string;
  status: CapaStatus;
  createdAt: string;
}

export interface AssetProcessEntity {
  id: string;
  name: string;
  code: string;
  unit: string;
  entityType: 'asset' | 'process' | 'unit';
  // ISO 55001 Dimension
  iso55001: {
    criticality: CriticalityLevel;
    consequence: 1 | 2 | 3 | 4 | 5;
    likelihood: 1 | 2 | 3 | 4 | 5;
    lifecycleStage: LifecycleStage;
    maintenanceStrategy: MaintenanceStrategy;
    replacementCostMillion: number;
  };
  // ISO 50001 Dimension
  iso50001: {
    isSeu: boolean;
    energyCarrier: 'برق (Electricity)' | 'گاز طبیعی (Natural Gas)' | 'بخار (Steam)' | 'گازوئیل (Diesel)';
    baselineEnb: number; // kWh or GJ per month
    actualConsumption: number;
    productionOutput: number;
    enpiUnit: string; // e.g. "kWh / تن محصول"
  };
  // ISO 45001 Dimension
  iso45001: {
    primaryHazard: string;
    initialSeverity: 1 | 2 | 3 | 4 | 5;
    initialLikelihood: 1 | 2 | 3 | 4 | 5;
    controlsApplied: ControlHierarchyLevel[];
    controlDescription: string;
  };
  // ISO 14001 Dimension
  iso14001: {
    primaryAspect: string;
    impactCategory: 'آلودگی هوا' | 'پساب صنعتی' | 'پسماند ویژه' | 'نشت و خاک' | 'آلودگی صوتی';
    severity: 1 | 2 | 3 | 4 | 5;
    probability: 1 | 2 | 3 | 4 | 5;
    legalFactor: 1 | 2 | 3; // 1 = عادی, 2 = تحت پایش, 3 = الزام قانونی سخت‌گیرانه
    operationalControl: string;
  };
}

export interface EnvironmentalAspectRecord {
  id: string;
  assetId?: string;
  activityOrAsset: string;
  aspect: string;
  impact: string;
  condition: 'نرمال' | 'غیرنرمال' | 'اضطراری';
  severity: 1 | 2 | 3 | 4 | 5;
  probability: 1 | 2 | 3 | 4 | 5;
  legalFactor: 1 | 2 | 3;
  controlMeasure: string;
}

export interface LegalRequirementRecord {
  id: string;
  standard: IsoStandardCode;
  regulationCode: string;
  title: string;
  authority: string;
  applicableUnit: string;
  complianceStatus: 'compliant' | 'partial' | 'non_compliant';
  nextReviewDate: string;
}

export interface HiraRiskRecord {
  id: string;
  assetId?: string;
  activityOrAsset: string;
  hazard: string;
  consequence: string;
  initialSeverity: 1 | 2 | 3 | 4 | 5;
  initialLikelihood: 1 | 2 | 3 | 4 | 5;
  controlsApplied: ControlHierarchyLevel[];
  controlAction: string;
  owner: string;
}

export interface EnergySeuRecord {
  id: string;
  assetId?: string;
  consumerName: string;
  unit: string;
  carrier: 'برق (Electricity)' | 'گاز طبیعی (Natural Gas)' | 'بخار (Steam)' | 'گازوئیل (Diesel)';
  isSeu: boolean;
  enbBaseline: number; // baseline energy (MWh or GJ)
  actualEnergy: number; // actual energy (MWh or GJ)
  outputVolume: number; // units produced or operating hours
  outputUnit: string;
  targetReductionPct: number;
}

export interface SampPlan {
  organizationMission: string;
  planningHorizon: string;
  assetObjectives: string;
  criticalityPolicy: string;
  lifecycleFundingStrategy: string;
  riskAndResilienceApproach: string;
  kpiMetrics: string;
  reviewCycle: string;
}

export interface DocumentMapEntry {
  id: string;
  code: string;
  title: string;
  layer: DocumentLayer;
  standards: IsoStandardCode[];
  clauseRef: string;
  mandatory: boolean;
  status: DocumentStatus;
  owner: string;
}

export interface ImsProjectState {
  version: number;
  organizationName: string;
  lastUpdated: string;
  evaluations: Record<string, GapEvaluation>;
  capas: ImsCapaItem[];
  assets: AssetProcessEntity[];
  environmentalAspects: EnvironmentalAspectRecord[];
  legalRegister: LegalRequirementRecord[];
  hiraRisks: HiraRiskRecord[];
  energyConsumers: EnergySeuRecord[];
  samp: SampPlan;
  documents: DocumentMapEntry[];
}
