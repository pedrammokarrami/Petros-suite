export type ZoneFocusId = 'overview' | 'intake' | 'approval' | 'ai_core' | 'logistics';

export type PlatformModule =
  | 'architecture'
  | 'document_ai'
  | 'profile_360'
  | 'compliance'
  | 'ims_suite'
  | null;

export interface CameraFocusPreset {
  id: ZoneFocusId;
  label: string;
  target: [number, number, number];
  zoomDesktop: number;
  zoomMobile: number;
}

export interface ProcessArchNode {
  id: string;
  level: 0 | 1 | 2 | 3;
  code: string;
  title: string;
  owner: string;
  zoneId: ZoneFocusId;
  status: 'healthy' | 'bottleneck' | 'optimized';
  children?: ProcessArchNode[];
}

export interface BpmnNode {
  id: string;
  type: 'start' | 'task' | 'gateway' | 'end';
  label: string;
  role: string;
  zoneId: Exclude<ZoneFocusId, 'overview'>;
  isBottleneck?: boolean;
}

export interface RaciRow {
  activity: string;
  intakeSpecialist: 'R' | 'A' | 'C' | 'I' | '—';
  departmentManager: 'R' | 'A' | 'C' | 'I' | '—';
  aiEngine: 'R' | 'A' | 'C' | 'I' | '—';
  procurementTeam: 'R' | 'A' | 'C' | 'I' | '—';
}

export interface CustomZoneLabels {
  processTitle: string;
  intakeLabel: string;
  approvalAsIsLabel: string;
  approvalToBeLabel: string;
  logisticsLabel: string;
}

export interface DocumentAnalysisResult {
  processTitle: string;
  summary: string;
  extractedStepsCount: number;
  detectedBottlenecks: number;
  estimatedTimeReduction: string;
  bpmnNodes: BpmnNode[];
  raciMatrix: RaciRow[];
  zoneLabels: CustomZoneLabels;
}

export interface MaturityDimension {
  key: 'owner' | 'documentation' | 'kpi' | 'risk' | 'digitalization';
  label: string;
  baseScore: number;
  toBeBonus: number;
}

export interface LeanWasteItem {
  id: string;
  title: string;
  wasteType: string;
  impactMinutes: number;
  description: string;
  eliminatedInToBe: boolean;
}

export interface StationProfile360 {
  zoneId: Exclude<ZoneFocusId, 'overview'>;
  title: string;
  roleTitle: string;
  ownerName: string;
  slaTarget: string;
  currentCycle: string;
  toBeCycle: string;
  aiRecommendations: string[];
  wastes: LeanWasteItem[];
}

export interface CapaPlan {
  rootCause: string;
  correctiveAction: string;
  owner: string;
  targetDays: number;
  maturityGain: number;
}

export interface ComplianceClause {
  id: string;
  standard: 'ISO 9001:2015' | 'EFQM 2025';
  clauseCode: string;
  title: string;
  linkedZone: Exclude<ZoneFocusId, 'overview'>;
  status: 'compliant' | 'nonconformity' | 'resolved';
  finding: string;
  capa?: CapaPlan;
}
