import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ProcessScene } from './components/scene/ProcessScene';
import { PersianHud } from './components/hud/PersianHud';
import {
  createInitialSimState,
  getHudSnapshot,
  setAutoSpawn,
  setSimSpeed,
  spawnPacket,
  switchMode,
} from './simulation/engine';
import { COMPLIANCE_CLAUSES_BY_LOCALE } from './i18n/translations';
import { generateCapaForClause } from './platform/analyzer';
import { detectSoftwareWebGL } from './utils/webgl';
import type {
  SimHudSnapshot,
  SimMode,
  SpeedMultiplier,
} from './simulation/types';
import type {
  ComplianceClause,
  CustomZoneLabels,
  DocumentAnalysisResult,
  PlatformModule,
  ProcessArchNode,
  ZoneFocusId,
} from './platform/types';
import type { Locale } from './i18n/types';

export default function App() {
  const isSoftwareGl = useMemo(() => detectSoftwareWebGL(), []);

  // Mutable 3D simulation state held in ref so high-frequency ticks never re-mount Canvas
  const simRef = useRef(createInitialSimState('AS_IS'));

  const [locale, setLocale] = useState<Locale>('fa');
  const [mode, setMode] = useState<SimMode>('AS_IS');
  const [speed, setSpeed] = useState<SpeedMultiplier>(1);
  const [autoSpawn, setAutoSpawnState] = useState<boolean>(true);
  const [hudSnapshot, setHudSnapshot] = useState<SimHudSnapshot>(() =>
    getHudSnapshot(simRef.current)
  );

  // Platform module & 3D spatial focus states
  const [activeModule, setActiveModule] = useState<PlatformModule>(null);
  const [focusedZone, setFocusedZone] = useState<ZoneFocusId>('overview');
  const [focusNonce, setFocusNonce] = useState<number>(0);
  const [activeArchNodeId, setActiveArchNodeId] = useState<string>('l0-value-chain');
  const [selectedStation, setSelectedStation] =
    useState<Exclude<ZoneFocusId, 'overview'>>('approval');

  // Store resolved CAPA clause IDs in a language-independent set so switching FA <-> EN preserves & re-localizes CAPAs
  const [resolvedClauseIds, setResolvedClauseIds] = useState<string[]>([]);
  const [latestAnalysis, setLatestAnalysis] = useState<DocumentAnalysisResult | null>(null);
  const [customLabels, setCustomLabels] = useState<CustomZoneLabels | null>(null);

  // Sync HTML lang & dir attributes dynamically for crisp RTL (Vazirmatn) vs LTR (SF Pro / Plus Jakarta Sans)
  useEffect(() => {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'fa' ? 'rtl' : 'ltr';
  }, [locale]);

  const clauses = useMemo<ComplianceClause[]>(() => {
    const resolvedSet = new Set(resolvedClauseIds);
    return COMPLIANCE_CLAUSES_BY_LOCALE[locale].map((clause) => {
      if (resolvedSet.has(clause.id) && clause.status === 'nonconformity') {
        return {
          ...clause,
          status: 'resolved',
          capa: generateCapaForClause(clause, locale),
        };
      }
      return clause;
    });
  }, [locale, resolvedClauseIds]);

  const resolvedCapaCount = resolvedClauseIds.length;

  const focusCameraOnZone = useCallback((zone: ZoneFocusId) => {
    setFocusedZone(zone);
    setFocusNonce((n) => n + 1);
  }, []);

  const handleLocaleChange = useCallback((nextLocale: Locale) => {
    setLocale(nextLocale);
    // Clear language-specific custom document badges so 3D badges immediately switch to the new language
    setCustomLabels(null);
    setLatestAnalysis(null);
  }, []);

  const handleModeChange = useCallback((nextMode: SimMode) => {
    switchMode(simRef.current, nextMode);
    setMode(nextMode);
    setHudSnapshot(getHudSnapshot(simRef.current));
  }, []);

  const handleSpeedChange = useCallback((nextSpeed: SpeedMultiplier) => {
    setSimSpeed(simRef.current, nextSpeed);
    setSpeed(nextSpeed);
  }, []);

  const handleSpawnPacket = useCallback(() => {
    spawnPacket(simRef.current);
    setHudSnapshot(getHudSnapshot(simRef.current));
  }, []);

  const handleToggleAutoSpawn = useCallback(() => {
    const next = !simRef.current.autoSpawn;
    setAutoSpawn(simRef.current, next);
    setAutoSpawnState(next);
  }, []);

  const handleSelectArchNode = useCallback(
    (node: ProcessArchNode) => {
      setActiveArchNodeId(node.id);
      focusCameraOnZone(node.zoneId);
      if (node.zoneId !== 'overview') {
        setSelectedStation(node.zoneId);
      }
    },
    [focusCameraOnZone]
  );

  // Clicking any 3D station/worker focuses the camera on it & opens its 360° profile
  const handleSelectStationFromScene = useCallback(
    (station: Exclude<ZoneFocusId, 'overview'>) => {
      setSelectedStation(station);
      setActiveModule('profile_360');
      focusCameraOnZone(station);
    },
    [focusCameraOnZone]
  );

  // Applying AI Document analysis dynamically updates 3D station labels & spawns a packet wave
  const handleApplyDocumentAnalysis = useCallback((result: DocumentAnalysisResult) => {
    setLatestAnalysis(result);
    setCustomLabels(result.zoneLabels);
    spawnPacket(simRef.current);
    spawnPacket(simRef.current);
    setHudSnapshot(getHudSnapshot(simRef.current));
  }, []);

  // One-click AI CAPA resolution updates clause status, maturity score, and pulses AI core if relevant
  const handleApplyCapa = useCallback(
    (clauseId: string) => {
      setResolvedClauseIds((prev) =>
        prev.includes(clauseId) ? prev : [...prev, clauseId]
      );
      if (clauseId === 'efqm-4' && simRef.current.mode === 'AS_IS') {
        handleModeChange('TO_BE');
      }
    },
    [handleModeChange]
  );

  const handleHudUpdate = useCallback((nextSnapshot: SimHudSnapshot) => {
    setHudSnapshot((prev) => {
      if (
        prev.mode === nextSnapshot.mode &&
        prev.queueCount === nextSnapshot.queueCount &&
        prev.activeCount === nextSnapshot.activeCount &&
        prev.completedCount === nextSnapshot.completedCount
      ) {
        return prev;
      }
      return nextSnapshot;
    });
  }, []);

  return (
    <main
      className="relative h-screen w-screen overflow-hidden bg-[#090d16]"
      data-locale={locale}
      data-mode={mode}
      data-speed={speed}
      data-autospawn={autoSpawn ? 'on' : 'off'}
      data-active-module={activeModule ?? 'none'}
      data-focused-zone={focusedZone}
      data-queue-count={hudSnapshot.queueCount}
      data-active-count={hudSnapshot.activeCount}
      data-completed-count={hudSnapshot.completedCount}
      data-resolved-capa={resolvedCapaCount}
    >
      <ProcessScene
        mode={mode}
        locale={locale}
        simRef={simRef}
        isSoftwareGl={isSoftwareGl}
        focusedZone={focusedZone}
        focusNonce={focusNonce}
        customLabels={customLabels}
        onHudUpdate={handleHudUpdate}
        onSelectStation={handleSelectStationFromScene}
      />

      <PersianHud
        mode={mode}
        locale={locale}
        speed={speed}
        autoSpawn={autoSpawn}
        snapshot={hudSnapshot}
        isSoftwareGl={isSoftwareGl}
        activeModule={activeModule}
        focusedZone={focusedZone}
        activeArchNodeId={activeArchNodeId}
        selectedStation={selectedStation}
        clauses={clauses}
        resolvedCapaCount={resolvedCapaCount}
        latestAnalysis={latestAnalysis}
        onModeChange={handleModeChange}
        onLocaleChange={handleLocaleChange}
        onSpeedChange={handleSpeedChange}
        onSpawnPacket={handleSpawnPacket}
        onToggleAutoSpawn={handleToggleAutoSpawn}
        onSelectModule={setActiveModule}
        onSelectArchNode={handleSelectArchNode}
        onSelectStation={setSelectedStation}
        onFocusZone={focusCameraOnZone}
        onApplyDocumentAnalysis={handleApplyDocumentAnalysis}
        onApplyCapa={handleApplyCapa}
      />
    </main>
  );
}
