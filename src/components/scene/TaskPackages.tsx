import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  MAX_ACTIVE_PACKETS,
  getHudSnapshot,
  stepSimulation,
} from '../../simulation/engine';
import type { PacketStage, SimHudSnapshot, SimState } from '../../simulation/types';

interface TaskPackagesProps {
  simRef: React.MutableRefObject<SimState>;
  onHudUpdate: (snapshot: SimHudSnapshot) => void;
}

const COLOR_INTAKE = new THREE.Color('#38bdf8');
const COLOR_QUEUED_AMBER = new THREE.Color('#f59e0b');
const COLOR_QUEUED_RED = new THREE.Color('#ef4444');
const COLOR_AI_CYAN = new THREE.Color('#06b6d4');
const COLOR_APPROVED_EMERALD = new THREE.Color('#10b981');
const _scratchColor = new THREE.Color();

function getStageSemanticColor(stage: PacketStage, stageTimer: number, routeMode: 'AS_IS' | 'TO_BE'): THREE.Color {
  switch (stage) {
    case 'intake_to_approval':
      return routeMode === 'TO_BE' ? COLOR_AI_CYAN : COLOR_INTAKE;
    case 'queued': {
      // Shift from amber to urgent crimson the longer a packet sits in the bottleneck
      const heat = Math.min(1, stageTimer / 5.5);
      return _scratchColor.copy(COLOR_QUEUED_AMBER).lerp(COLOR_QUEUED_RED, heat);
    }
    case 'manual_review':
      return COLOR_QUEUED_AMBER;
    case 'ai_reroute':
    case 'ai_processing':
      return COLOR_AI_CYAN;
    case 'approval_to_logistics':
    case 'conveyor':
      return routeMode === 'TO_BE' ? COLOR_APPROVED_EMERALD : COLOR_INTAKE;
  }
}

/**
 * Drives the real-time useFrame simulation loop and renders a fixed pool of composite
 * glowing 3D task packages without per-frame React re-renders or GC churn.
 */
export function TaskPackages({ simRef, onHudUpdate }: TaskPackagesProps) {
  const poolRefs = useRef<(THREE.Group | null)[]>([]);
  const bandMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const coreMatRefs = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const hudTimerRef = useRef(0);

  // Shared geometries across pooled task packages
  const geometries = useMemo(() => {
    return {
      shell: new THREE.BoxGeometry(0.34, 0.22, 0.28),
      band: new THREE.BoxGeometry(0.355, 0.075, 0.295),
      cap: new THREE.BoxGeometry(0.18, 0.045, 0.14),
    };
  }, []);

  const shellMaterial = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.34,
        metalness: 0.62,
      }),
    []
  );

  useEffect(() => {
    return () => {
      geometries.shell.dispose();
      geometries.band.dispose();
      geometries.cap.dispose();
      shellMaterial.dispose();
    };
  }, [geometries, shellMaterial]);

  useFrame(({ clock }, rawDelta) => {
    const state = simRef.current;
    stepSimulation(state, rawDelta);

    const t = clock.getElapsedTime();
    const packets = state.packets;

    for (let i = 0; i < MAX_ACTIVE_PACKETS; i++) {
      const group = poolRefs.current[i];
      if (!group) continue;

      if (i < packets.length) {
        const p = packets[i];
        group.visible = true;

        // Subtle hover bob while traveling; tense micro-vibration when queued in bottleneck
        let yLift = 0;
        if (p.stage === 'queued') {
          yLift = Math.sin(t * 7 + p.id) * 0.012;
        } else if (p.stage !== 'conveyor') {
          yLift = Math.sin(t * 4.5 + p.id * 0.9) * 0.035;
        }

        group.position.set(p.position.x, p.position.y + yLift, p.position.z);
        group.rotation.y = p.yaw;
        group.scale.setScalar(p.scale);

        const semantic = getStageSemanticColor(p.stage, p.stageTimer, p.routeMode);
        const bandMat = bandMatRefs.current[i];
        const coreMat = coreMatRefs.current[i];
        if (bandMat && coreMat) {
          bandMat.color.copy(semantic);
          bandMat.emissive.copy(semantic);
          bandMat.emissiveIntensity =
            p.stage === 'ai_processing' ? 2.4 : p.stage === 'queued' ? 1.25 : 1.35;

          coreMat.color.copy(semantic);
          coreMat.emissive.copy(semantic);
          coreMat.emissiveIntensity = p.stage === 'ai_processing' ? 2.6 : 1.05;
        }
      } else {
        group.visible = false;
      }
    }

    // Throttle React HUD metric pushes to ~5Hz so 3D loop never triggers excessive React commits
    hudTimerRef.current += rawDelta;
    if (hudTimerRef.current >= 0.2) {
      hudTimerRef.current = 0;
      onHudUpdate(getHudSnapshot(state));
    }
  });

  return (
    <group>
      {Array.from({ length: MAX_ACTIVE_PACKETS }).map((_, idx) => (
        <group
          key={idx}
          visible={false}
          ref={(el) => {
            poolRefs.current[idx] = el;
          }}
        >
          {/* Part 1: Chamfered dark-metallic smart-crate body */}
          <mesh geometry={geometries.shell} material={shellMaterial} castShadow receiveShadow />

          {/* Part 2: Glowing semantic status waist band */}
          <mesh geometry={geometries.band}>
            <meshStandardMaterial
              ref={(el) => {
                bandMatRefs.current[idx] = el;
              }}
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={1.3}
              roughness={0.22}
              metalness={0.2}
            />
          </mesh>

          {/* Part 3: Illuminated top telemetry clasp */}
          <mesh geometry={geometries.cap} position={[0, 0.125, 0]}>
            <meshStandardMaterial
              ref={(el) => {
                coreMatRefs.current[idx] = el;
              }}
              color="#38bdf8"
              emissive="#38bdf8"
              emissiveIntensity={1.0}
              roughness={0.2}
              metalness={0.4}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}
