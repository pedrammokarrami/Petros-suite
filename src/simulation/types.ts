export type SimMode = 'AS_IS' | 'TO_BE';

export type SpeedMultiplier = 1 | 2;

export type PacketStage =
  | 'intake_to_approval'
  | 'queued'
  | 'manual_review'
  | 'ai_reroute'
  | 'ai_processing'
  | 'approval_to_logistics'
  | 'conveyor';

export interface Vec3Tuple {
  x: number;
  y: number;
  z: number;
}

export interface TaskPacket {
  id: number;
  stage: PacketStage;
  /** Normalized progress within current spline leg [0, 1] */
  progress: number;
  /** World-space position computed each tick */
  position: Vec3Tuple;
  /** Yaw orientation (radians) along travel direction */
  yaw: number;
  /** Time spent waiting or being processed in current stage (seconds) */
  stageTimer: number;
  /** Assigned slot index when queued at Zone 2 in AS-IS mode */
  queueSlot: number;
  /** Start position used for smooth reroute when switching AS-IS -> TO-BE */
  rerouteOrigin: Vec3Tuple | null;
  /** Mode under which the packet is currently routing */
  routeMode: SimMode;
  /** Scale-in/out factor for smooth spawn & despawn */
  scale: number;
}

export interface ModeKpi {
  mode: SimMode;
  statusLabel: string;
  cycleTimeLabel: string;
  efficiencyLabel: string;
  efficiencyPercent: number;
  tone: 'amber' | 'emerald';
}

export interface SimHudSnapshot {
  mode: SimMode;
  queueCount: number;
  activeCount: number;
  completedCount: number;
  aiPulseEnergy: number;
  bottleneckLevel: number;
  kpi: ModeKpi;
}

export interface SimState {
  mode: SimMode;
  speed: SpeedMultiplier;
  autoSpawn: boolean;
  packets: TaskPacket[];
  nextPacketId: number;
  spawnAccumulator: number;
  completedCount: number;
  elapsed: number;
  /** Decaying [0, 1] visual pulse triggered each time AI Core approves a packet */
  aiPulseEnergy: number;
  /** Conveyor belt scroll offset */
  conveyorOffset: number;
}
