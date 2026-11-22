export type Locale = 'fa' | 'en';

export interface UiDictionary {
  brandShort: string;
  brandFull: string;
  modeGroupAria: string;
  modeAsIsFull: string;
  modeAsIsShort: string;
  modeToBeFull: string;
  modeToBeShort: string;
  speedGroupAria: string;
  speedLabel: string;
  speedAria: (mult: number) => string;
  langGroupAria: string;
  statusCardAria: string;
  statusExpandAria: string;
  statusCollapseAria: string;
  statusCompactAsIs: string;
  statusCompactToBe: string;
  statusFullAsIs: string;
  statusFullToBe: string;
  cycleTimeLabel: string;
  cycleTimeAsIs: string;
  cycleTimeToBe: string;
  efficiencyLabel: string;
  queueLabel: string;
  completedLabel: string;
  spawnButton: string;
  spawnButtonShort: string;
  autoSpawnOn: string;
  autoSpawnOff: string;
  dockAria: string;
  dockResetCamera: string;
  dockResetCameraAria: string;
  dockModules: {
    architecture: { label: string; short: string };
    document_ai: { label: string; short: string };
    profile_360: { label: string; short: string };
    compliance: { label: string; short: string };
    ims_suite: { label: string; short: string };
  };
  badges3d: {
    intake: string;
    approvalAsIs: string;
    bottleneck: string;
    approvalToBe: string;
    logisticsAsIs: string;
    logisticsToBe: string;
  };
  zones: {
    overview: string;
    intake: string;
    approval: string;
    ai_core: string;
    logistics: string;
  };
  architecture: {
    title: string;
    subtitle: string;
    closeAria: string;
    currentFocus: string;
    viewIn3d: string;
    statusHealthy: string;
    statusBottleneck: string;
    statusOptimized: string;
  };
  documentAi: {
    title: string;
    subtitle: string;
    closeAria: string;
    samplesLabel: string;
    inputLabel: string;
    uploadLabel: string;
    placeholder: string;
    analyzeButton: string;
    analyzingButton: string;
    scanSteps: string[];
    appliedBanner: string;
    bpmnHeading: string;
    gatewaySub: string;
    raciHeading: string;
    activitiesSuffix: string;
    raciCols: {
      activity: string;
      intake: string;
      manager: string;
      ai: string;
      logistics: string;
    };
  };
  profile360: {
    title: string;
    subtitle: string;
    closeAria: string;
    tabs: {
      intake: string;
      approval: string;
      ai_core: string;
      logistics: string;
    };
    currentCycle: string;
    slaTarget: string;
    maturityTitle: string;
    maturityScoreLabel: string;
    leanTitle: string;
    fixWithToBe: string;
    wasteCleared: string;
    wasteMinutesSuffix: string;
    wasteTypePrefix: string;
    aiRecsTitle: string;
  };
  compliance: {
    title: string;
    subtitle: string;
    closeAria: string;
    complianceRate: string;
    openNonconformities: string;
    statusCompliant: string;
    statusNonconformity: string;
    statusResolved: string;
    inspectZoneLink: string;
    applyCapaButton: string;
    capaExecutedTitle: string;
    rootCauseLabel: string;
    correctiveActionLabel: string;
    ownerLabel: string;
    deadlineLabel: string;
    daysSuffix: string;
  };
  webglLost: {
    message: string;
    reloadButton: string;
  };
  demoGuide: {
    buttonLabel: string;
    buttonShort: string;
    buttonAria: string;
    title: string;
    subtitle: string;
    closeAria: string;
    dismissButton: string;
    tryStepLabel: string;
    doneLabel: string;
    steps: Array<{
      id: 'mode' | 'architecture' | 'document_ai' | 'maturity_capa';
      number: string;
      title: string;
      description: string;
      actionLabel: string;
      secondaryActionLabel?: string;
    }>;
  };
}
