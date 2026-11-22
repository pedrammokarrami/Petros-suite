import type {
  ModeKpi,
  SimHudSnapshot,
  SimMode,
  SimState,
  SpeedMultiplier,
  TaskPacket,
  Vec3Tuple,
} from './types';

// Spatial anchors matching the three 3D platform islands
export const AS_IS_LEG1: readonly Vec3Tuple[] = [
  { x: -4.85, y: 0.34, z: 0.55 },
  { x: -4.15, y: 0.28, z: 1.55 },
  { x: -3.25, y: 0.28, z: 1.92 },
  { x: -2.45, y: 0.28, z: 0.65 },
  { x: -1.65, y: 0.30, z: 1.35 },
];

export const AS_IS_LEG2: readonly Vec3Tuple[] = [
  { x: 0.45, y: 0.48, z: 1.45 },
  { x: 1.45, y: 0.28, z: 2.15 },
  { x: 2.35, y: 0.28, z: 1.75 },
  { x: 2.95, y: 0.28, z: 0.72 },
  { x: 3.85, y: 0.56, z: 0.55 },
];

export const TO_BE_LEG1: readonly Vec3Tuple[] = [
  { x: -4.85, y: 0.34, z: 0.55 },
  { x: -3.55, y: 0.34, z: -0.25 },
  { x: -2.05, y: 0.38, z: -1.05 },
  { x: -0.25, y: 0.46, z: -1.45 },
];

export const TO_BE_LEG2: readonly Vec3Tuple[] = [
  { x: 0.25, y: 0.46, z: -1.45 },
  { x: 1.95, y: 0.38, z: -0.95 },
  { x: 3.05, y: 0.44, z: -0.05 },
  { x: 3.85, y: 0.56, z: 0.55 },
];

export const CONVEYOR_PATH: readonly Vec3Tuple[] = [
  { x: 3.85, y: 0.56, z: 0.55 },
  { x: 5.75, y: 0.56, z: 0.55 },
  { x: 7.65, y: 0.56, z: 0.55 },
];

export const MANAGER_REVIEW_POS: Vec3Tuple = { x: 0.38, y: 0.86, z: 1.45 };
export const AI_CORE_GATE_POS: Vec3Tuple = { x: 0.0, y: 0.52, z: -1.45 };

// Simulation pacing constants
export const AS_IS_TRAVEL_SPEED = 0.21; // leg progress per second
export const TO_BE_TRAVEL_SPEED = AS_IS_TRAVEL_SPEED * 3.0; // exact 3x speed improvement
export const AS_IS_CONVEYOR_SPEED = 0.22;
export const TO_BE_CONVEYOR_SPEED = AS_IS_CONVEYOR_SPEED * 3.0;
export const MANUAL_REVIEW_DURATION = 3.2; // seconds at 1x -> creates visible bottleneck
export const AI_PROCESS_DURATION = 0.22; // near-instant AI verification flash
export const AUTO_SPAWN_INTERVAL_AS_IS = 1.65;
export const AUTO_SPAWN_INTERVAL_TO_BE = 1.25;
export const MAX_ACTIVE_PACKETS = 18;

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

export function toPersianDigits(value: number | string): string {
  return String(value).replace(/\d/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
}

export function getModeKpi(mode: SimMode): ModeKpi {
  if (mode === 'TO_BE') {
    return {
      mode,
      statusLabel: 'عملیات خودکار فعال است',
      cycleTimeLabel: '۱۲ دقیقه',
      efficiencyLabel: '۹۶٪',
      efficiencyPercent: 96,
      tone: 'emerald',
    };
  }
  return {
    mode,
    statusLabel: 'هشدار گلوگاه فرآیندی',
    cycleTimeLabel: '۴.۲ روز',
    efficiencyLabel: '۴۲٪',
    efficiencyPercent: 42,
    tone: 'amber',
  };
}

/**
 * Sample a polyline path smoothly at normalized t in [0, 1]
 * returning interpolated position and horizontal yaw angle.
 */
export function samplePolyline(
  points: readonly Vec3Tuple[],
  rawT: number
): { position: Vec3Tuple; yaw: number } {
  const t = Math.max(0, Math.min(1, rawT));
  const segCount = points.length - 1;
  if (segCount <= 0) {
    return { position: { ...points[0] }, yaw: 0 };
  }

  // Compute cumulative arc lengths for uniform speed along waypoints
  let totalLength = 0;
  const lengths: number[] = [];
  for (let i = 0; i < segCount; i++) {
    const dx = points[i + 1].x - points[i].x;
    const dy = points[i + 1].y - points[i].y;
    const dz = points[i + 1].z - points[i].z;
    const len = Math.hypot(dx, dy, dz);
    lengths.push(len);
    totalLength += len;
  }

  if (totalLength < 1e-6) {
    return { position: { ...points[0] }, yaw: 0 };
  }

  const targetDist = t * totalLength;
  let accum = 0;
  for (let i = 0; i < segCount; i++) {
    const segLen = lengths[i];
    if (accum + segLen >= targetDist || i === segCount - 1) {
      const localT = segLen > 1e-6 ? Math.max(0, Math.min(1, (targetDist - accum) / segLen)) : 0;
      const a = points[i];
      const b = points[i + 1];
      const position: Vec3Tuple = {
        x: a.x + (b.x - a.x) * localT,
        y: a.y + (b.y - a.y) * localT,
        z: a.z + (b.z - a.z) * localT,
      };
      const yaw = Math.atan2(b.x - a.x, b.z - a.z);
      return { position, yaw };
    }
    accum += segLen;
  }

  const last = points[points.length - 1];
  const prev = points[points.length - 2];
  return {
    position: { ...last },
    yaw: Math.atan2(last.x - prev.x, last.z - prev.z),
  };
}

/**
 * Computes a deterministic 3D stacked queue position beside the Zone 2 Manager Desk.
 */
export function getQueueSlotPosition(slotIndex: number): Vec3Tuple {
  const cols = 3;
  const rows = 2;
  const perLayer = cols * rows;
  const layer = Math.floor(slotIndex / perLayer);
  const inLayer = slotIndex % perLayer;
  const col = inLayer % cols;
  const row = Math.floor(inLayer / cols);

  return {
    x: -1.78 + col * 0.48,
    y: 0.24 + layer * 0.34,
    z: 1.05 + row * 0.56,
  };
}

function createPacket(id: number, mode: SimMode, initialProgress = 0): TaskPacket {
  const path = mode === 'TO_BE' ? TO_BE_LEG1 : AS_IS_LEG1;
  const sampled = samplePolyline(path, initialProgress);
  return {
    id,
    stage: 'intake_to_approval',
    progress: initialProgress,
    position: sampled.position,
    yaw: sampled.yaw,
    stageTimer: 0,
    queueSlot: -1,
    rerouteOrigin: null,
    routeMode: mode,
    scale: initialProgress > 0 ? 1 : 0.05,
  };
}

/**
 * Initializes the simulation with realistic in-flight packets so the very first frame
 * immediately showcases the AS-IS bottleneck workflow without waiting for spawn timers.
 */
export function createInitialSimState(initialMode: SimMode = 'AS_IS'): SimState {
  const state: SimState = {
    mode: initialMode,
    speed: 1,
    autoSpawn: true,
    packets: [],
    nextPacketId: 1,
    spawnAccumulator: 0,
    completedCount: initialMode === 'TO_BE' ? 28 : 6,
    elapsed: 0,
    aiPulseEnergy: initialMode === 'TO_BE' ? 0.65 : 0,
    conveyorOffset: 0,
  };

  if (initialMode === 'AS_IS') {
    // Seed a visible bottleneck right away on first paint:
    // 1 packet in manual review, 4 queued in backlog stack, 2 traveling on leg 1, 1 on conveyor
    const reviewPacket = createPacket(state.nextPacketId++, 'AS_IS', 1);
    reviewPacket.stage = 'manual_review';
    reviewPacket.position = { ...MANAGER_REVIEW_POS };
    reviewPacket.stageTimer = 1.1;
    reviewPacket.scale = 1;
    state.packets.push(reviewPacket);

    for (let slot = 0; slot < 4; slot++) {
      const queued = createPacket(state.nextPacketId++, 'AS_IS', 1);
      queued.stage = 'queued';
      queued.queueSlot = slot;
      queued.position = getQueueSlotPosition(slot);
      queued.stageTimer = 2.5 - slot * 0.4;
      queued.scale = 1;
      state.packets.push(queued);
    }

    state.packets.push(createPacket(state.nextPacketId++, 'AS_IS', 0.25));
    state.packets.push(createPacket(state.nextPacketId++, 'AS_IS', 0.68));

    const conv = createPacket(state.nextPacketId++, 'AS_IS', 0.45);
    conv.stage = 'conveyor';
    conv.progress = 0.42;
    const convSample = samplePolyline(CONVEYOR_PATH, conv.progress);
    conv.position = convSample.position;
    conv.yaw = convSample.yaw;
    state.packets.push(conv);
  } else {
    state.packets.push(createPacket(state.nextPacketId++, 'TO_BE', 0.2));
    state.packets.push(createPacket(state.nextPacketId++, 'TO_BE', 0.72));
    const leg2 = createPacket(state.nextPacketId++, 'TO_BE', 0.45);
    leg2.stage = 'approval_to_logistics';
    const s2 = samplePolyline(TO_BE_LEG2, leg2.progress);
    leg2.position = s2.position;
    leg2.yaw = s2.yaw;
    state.packets.push(leg2);
  }

  return state;
}

export function spawnPacket(state: SimState): TaskPacket | null {
  if (state.packets.length >= MAX_ACTIVE_PACKETS) {
    return null;
  }
  const packet = createPacket(state.nextPacketId++, state.mode, 0);
  state.packets.push(packet);
  return packet;
}

export function setSimSpeed(state: SimState, speed: SpeedMultiplier): void {
  state.speed = speed;
}

export function setAutoSpawn(state: SimState, enabled: boolean): void {
  state.autoSpawn = enabled;
}

/**
 * Transitions the simulation between AS-IS and TO-BE.
 * Switching to TO-BE immediately clears the Zone 2 queue by rerouting all
 * queued and manually-reviewed packets straight into the AI Core.
 */
export function switchMode(state: SimState, nextMode: SimMode): void {
  if (state.mode === nextMode) return;
  state.mode = nextMode;

  if (nextMode === 'TO_BE') {
    state.aiPulseEnergy = 1.0;
    let staggerIndex = 0;
    for (const packet of state.packets) {
      packet.routeMode = 'TO_BE';
      if (packet.stage === 'queued' || packet.stage === 'manual_review') {
        packet.stage = 'ai_reroute';
        packet.queueSlot = -1;
        packet.rerouteOrigin = { ...packet.position };
        // Slight stagger so queued packages stream gracefully into the AI core instead of overlapping
        packet.progress = Math.max(-0.55, -staggerIndex * 0.14);
        packet.stageTimer = 0;
        staggerIndex++;
      }
    }
  } else {
    for (const packet of state.packets) {
      if (packet.stage === 'ai_reroute' || packet.stage === 'ai_processing') {
        packet.routeMode = 'AS_IS';
        packet.stage = 'queued';
        packet.rerouteOrigin = null;
        packet.stageTimer = 0;
      } else if (packet.stage === 'intake_to_approval') {
        packet.routeMode = 'AS_IS';
      }
    }
    reassignQueueSlots(state);
  }
}

function reassignQueueSlots(state: SimState): void {
  let slot = 0;
  for (const packet of state.packets) {
    if (packet.stage === 'queued') {
      packet.queueSlot = slot++;
    }
  }
}

/**
 * Advances the simulation by rawDelta seconds (clamped for stability).
 */
export function stepSimulation(state: SimState, rawDelta: number): void {
  const dt = Math.min(Math.max(rawDelta, 0), 0.1) * state.speed;
  if (dt <= 0) return;

  state.elapsed += dt;
  state.aiPulseEnergy = Math.max(0, state.aiPulseEnergy - dt * 1.45);

  const isToBe = state.mode === 'TO_BE';
  const conveyorSpeed = isToBe ? TO_BE_CONVEYOR_SPEED : AS_IS_CONVEYOR_SPEED;
  state.conveyorOffset = (state.conveyorOffset + dt * conveyorSpeed * 3.8) % 1;

  // Auto-spawning logic
  if (state.autoSpawn) {
    state.spawnAccumulator += dt;
    const spawnInterval = isToBe ? AUTO_SPAWN_INTERVAL_TO_BE : AUTO_SPAWN_INTERVAL_AS_IS;
    if (state.spawnAccumulator >= spawnInterval) {
      state.spawnAccumulator -= spawnInterval;
      // Keep AS-IS queue full and dramatic without unbounded growth
      const maxForMode = isToBe ? 10 : 13;
      if (state.packets.length < maxForMode) {
        spawnPacket(state);
      }
    }
  }

  let hasManualReviewer = state.packets.some((p) => p.stage === 'manual_review');
  const surviving: TaskPacket[] = [];

  for (const packet of state.packets) {
    // Smooth spawn scale-in
    if (packet.scale < 1 && packet.stage !== 'conveyor') {
      packet.scale = Math.min(1, packet.scale + dt * 4.5);
    }

    const packetToBe = packet.routeMode === 'TO_BE' || isToBe;
    const travelSpeed = packetToBe ? TO_BE_TRAVEL_SPEED : AS_IS_TRAVEL_SPEED;

    switch (packet.stage) {
      case 'intake_to_approval': {
        packet.progress += dt * travelSpeed;
        const path = packetToBe ? TO_BE_LEG1 : AS_IS_LEG1;
        const sampled = samplePolyline(path, Math.min(1, packet.progress));
        packet.position = sampled.position;
        packet.yaw = sampled.yaw;

        if (packet.progress >= 1) {
          packet.progress = 0;
          packet.stageTimer = 0;
          if (isToBe) {
            packet.stage = 'ai_processing';
            packet.position = { ...AI_CORE_GATE_POS };
            state.aiPulseEnergy = 1.0;
          } else if (!hasManualReviewer) {
            packet.stage = 'manual_review';
            packet.position = { ...MANAGER_REVIEW_POS };
            hasManualReviewer = true;
          } else {
            packet.stage = 'queued';
          }
        }
        surviving.push(packet);
        break;
      }

      case 'queued': {
        packet.stageTimer += dt;
        if (isToBe) {
          packet.stage = 'ai_reroute';
          packet.rerouteOrigin = { ...packet.position };
          packet.progress = 0;
          packet.queueSlot = -1;
        } else if (!hasManualReviewer) {
          packet.stage = 'manual_review';
          packet.queueSlot = -1;
          packet.stageTimer = 0;
          hasManualReviewer = true;
        }
        surviving.push(packet);
        break;
      }

      case 'manual_review': {
        packet.stageTimer += dt;
        // Smoothly settle onto manager review desk
        packet.position.x += (MANAGER_REVIEW_POS.x - packet.position.x) * Math.min(1, dt * 6);
        packet.position.y += (MANAGER_REVIEW_POS.y - packet.position.y) * Math.min(1, dt * 6);
        packet.position.z += (MANAGER_REVIEW_POS.z - packet.position.z) * Math.min(1, dt * 6);

        if (isToBe) {
          packet.stage = 'ai_reroute';
          packet.rerouteOrigin = { ...packet.position };
          packet.progress = 0;
          hasManualReviewer = false;
        } else if (packet.stageTimer >= MANUAL_REVIEW_DURATION) {
          packet.stage = 'approval_to_logistics';
          packet.routeMode = 'AS_IS';
          packet.progress = 0;
          packet.stageTimer = 0;
          hasManualReviewer = false;
        }
        surviving.push(packet);
        break;
      }

      case 'ai_reroute': {
        packet.progress += dt * 1.95;
        const origin = packet.rerouteOrigin ?? packet.position;
        const t = Math.max(0, Math.min(1, packet.progress));
        const eased = t * t * (3 - 2 * t);
        const arcLift = Math.sin(eased * Math.PI) * 0.55;
        packet.position = {
          x: origin.x + (AI_CORE_GATE_POS.x - origin.x) * eased,
          y: origin.y + (AI_CORE_GATE_POS.y - origin.y) * eased + arcLift,
          z: origin.z + (AI_CORE_GATE_POS.z - origin.z) * eased,
        };
        packet.yaw = Math.atan2(AI_CORE_GATE_POS.x - origin.x, AI_CORE_GATE_POS.z - origin.z);

        if (packet.progress >= 1) {
          packet.stage = 'ai_processing';
          packet.progress = 0;
          packet.stageTimer = 0;
          packet.rerouteOrigin = null;
          state.aiPulseEnergy = 1.0;
        }
        surviving.push(packet);
        break;
      }

      case 'ai_processing': {
        packet.stageTimer += dt;
        packet.position = {
          x: AI_CORE_GATE_POS.x,
          y: AI_CORE_GATE_POS.y + Math.sin(packet.stageTimer * 18) * 0.05,
          z: AI_CORE_GATE_POS.z,
        };
        if (packet.stageTimer >= AI_PROCESS_DURATION) {
          packet.stage = 'approval_to_logistics';
          packet.routeMode = 'TO_BE';
          packet.progress = 0;
          packet.stageTimer = 0;
        }
        surviving.push(packet);
        break;
      }

      case 'approval_to_logistics': {
        packet.progress += dt * travelSpeed;
        const path = packet.routeMode === 'TO_BE' ? TO_BE_LEG2 : AS_IS_LEG2;
        const sampled = samplePolyline(path, Math.min(1, packet.progress));
        packet.position = sampled.position;
        packet.yaw = sampled.yaw;

        if (packet.progress >= 1) {
          packet.stage = 'conveyor';
          packet.progress = 0;
          packet.stageTimer = 0;
        }
        surviving.push(packet);
        break;
      }

      case 'conveyor': {
        packet.progress += dt * conveyorSpeed;
        const sampled = samplePolyline(CONVEYOR_PATH, Math.min(1, packet.progress));
        packet.position = sampled.position;
        packet.yaw = sampled.yaw;

        // Smooth scale-out as packet slides into dispatch portal
        if (packet.progress > 0.85) {
          packet.scale = Math.max(0.05, 1 - (packet.progress - 0.85) / 0.15);
        }

        if (packet.progress >= 1) {
          state.completedCount += 1;
        } else {
          surviving.push(packet);
        }
        break;
      }
    }
  }

  state.packets = surviving;

  // Compact queue slot indices & smoothly slide queued packages into neat stacked slots
  if (!isToBe) {
    reassignQueueSlots(state);
    for (const packet of state.packets) {
      if (packet.stage === 'queued') {
        const target = getQueueSlotPosition(packet.queueSlot);
        const blend = Math.min(1, dt * 7);
        packet.position.x += (target.x - packet.position.x) * blend;
        packet.position.y += (target.y - packet.position.y) * blend;
        packet.position.z += (target.z - packet.position.z) * blend;
        packet.yaw = 0;
      }
    }
  }
}

export function getHudSnapshot(state: SimState): SimHudSnapshot {
  let queueCount = 0;
  for (const p of state.packets) {
    if (p.stage === 'queued' || p.stage === 'manual_review') {
      queueCount++;
    }
  }
  const bottleneckLevel =
    state.mode === 'AS_IS' ? Math.min(1, queueCount / 5) : 0;

  return {
    mode: state.mode,
    queueCount,
    activeCount: state.packets.length,
    completedCount: state.completedCount,
    aiPulseEnergy: state.aiPulseEnergy,
    bottleneckLevel,
    kpi: getModeKpi(state.mode),
  };
}
