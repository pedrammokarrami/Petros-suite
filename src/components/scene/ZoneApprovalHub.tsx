import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PlatformIsland } from './PlatformIsland';
import { ManagerAvatar } from './Avatars';
import {
  createBrushedMetalBumpMap,
  createMonitorScreenTexture,
} from '../../utils/webgl';
import type { SimMode, SimState } from '../../simulation/types';
import type { ZoneFocusId } from '../../platform/types';

interface ZoneApprovalHubProps {
  mode: SimMode;
  simRef: React.MutableRefObject<SimState>;
  focusedZone: ZoneFocusId;
  onSelectStation: (station: 'approval' | 'ai_core') => void;
}

/**
 * Zone 2 (Center): Executive Approval Office & Autonomous AI Compute Bay.
 * North: Brushed-titanium liquid-cooled AI server racks + levitating optical scanner drone core
 * with translucent volumetric scan beam.
 * South: Executive glass-partitioned manager office with walnut desk, alert stack beacon,
 * and bottleneck queue staging pad.
 */
export function ZoneApprovalHub({
  mode,
  simRef,
  focusedZone,
  onSelectStation,
}: ZoneApprovalHubProps) {
  const isToBe = mode === 'TO_BE';
  const accentColor = isToBe ? '#10b981' : '#f59e0b';
  const [hoveredPart, setHoveredPart] = useState<'approval' | 'ai_core' | null>(null);

  const outerRingRef = useRef<THREE.Mesh>(null);
  const innerRingRef = useRef<THREE.Mesh>(null);
  const droneCoreRef = useRef<THREE.Group>(null);
  const scanConeRef = useRef<THREE.Mesh>(null);
  const coreLightRef = useRef<THREE.PointLight>(null);
  const warningBeaconRef = useRef<THREE.Mesh>(null);
  const warningLightRef = useRef<THREE.PointLight>(null);

  const managerAlertScreen = useMemo(() => createMonitorScreenTexture('manager_alert'), []);
  const managerIdleScreen = useMemo(() => createMonitorScreenTexture('manager_idle'), []);
  const metalBump = useMemo(() => createBrushedMetalBumpMap(), []);

  useEffect(() => {
    document.body.style.cursor = hoveredPart ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hoveredPart]);

  useEffect(() => {
    return () => {
      managerAlertScreen.dispose();
      managerIdleScreen.dispose();
      metalBump.dispose();
    };
  }, [managerAlertScreen, managerIdleScreen, metalBump]);

  useFrame(({ clock }) => {
    const time = clock.getElapsedTime();
    const pulse = simRef.current.aiPulseEnergy;

    if (outerRingRef.current && innerRingRef.current && droneCoreRef.current) {
      const spin = isToBe ? 1.55 + pulse * 2.1 : 0.22;
      outerRingRef.current.rotation.y = time * spin;
      outerRingRef.current.rotation.x = Math.PI * 0.36 + Math.sin(time * 1.1) * 0.12;

      innerRingRef.current.rotation.z = -time * (spin * 1.3);
      innerRingRef.current.rotation.y = -time * (spin * 0.6);

      droneCoreRef.current.rotation.y = time * (isToBe ? 1.2 : 0.25);
      droneCoreRef.current.position.y = 1.28 + Math.sin(time * (isToBe ? 2.6 : 1.0)) * 0.06;
      const scale = isToBe ? 1.0 + pulse * 0.16 : 0.9;
      droneCoreRef.current.scale.setScalar(scale);
    }

    if (scanConeRef.current) {
      const coneMat = scanConeRef.current.material as THREE.MeshBasicMaterial;
      coneMat.opacity = isToBe ? 0.14 + pulse * 0.14 : 0.0;
    }

    if (coreLightRef.current) {
      coreLightRef.current.intensity = isToBe ? 4.4 + pulse * 3.2 : 0.7;
    }

    if (warningBeaconRef.current && warningLightRef.current) {
      const mat = warningBeaconRef.current.material as THREE.MeshStandardMaterial;
      if (!isToBe) {
        const blink = 0.55 + Math.sin(time * 5.2) * 0.45;
        mat.emissiveIntensity = 0.75 + blink * 1.35;
        warningLightRef.current.intensity = 2.5 + blink * 2.0;
      } else {
        mat.emissiveIntensity = 0.06;
        warningLightRef.current.intensity = 0;
      }
    }
  });

  const isHubFocused = focusedZone === 'approval' || focusedZone === 'ai_core';

  return (
    <group position={[0, 0, 0]}>
      <PlatformIsland
        position={[0, 0, 0]}
        size={[5.4, 0.55, 5.8]}
        accentColor={isHubFocused || hoveredPart ? '#22d3ee' : accentColor}
        trimEmissiveIntensity={isHubFocused || hoveredPart ? 1.3 : isToBe ? 0.95 : 0.85}
        glassPartition="back"
        partitionHeight={2.25}
      />

      {/* Interior Low Architectural Glass Divider between AI Bay and Manager Office */}
      <group position={[0.15, 0, 0.05]}>
        <mesh position={[0, 0.035, 0]} castShadow>
          <boxGeometry args={[3.4, 0.07, 0.07]} />
          <meshStandardMaterial color="#475569" roughness={0.28} metalness={0.86} />
        </mesh>
        {[-1.65, 0, 1.65].map((mx, i) => (
          <mesh key={i} position={[mx, 0.56, 0]} castShadow>
            <boxGeometry args={[0.05, 1.08, 0.06]} />
            <meshStandardMaterial color="#64748b" roughness={0.25} metalness={0.88} />
          </mesh>
        ))}
        <mesh position={[0, 1.08, 0]}>
          <boxGeometry args={[3.4, 0.045, 0.065]} />
          <meshStandardMaterial color="#64748b" roughness={0.25} metalness={0.88} />
        </mesh>
        <mesh position={[0, 0.56, 0]}>
          <boxGeometry args={[3.28, 0.98, 0.018]} />
          <meshPhysicalMaterial
            color="#93c5fd"
            roughness={0.07}
            clearcoat={1}
            clearcoatRoughness={0.06}
            transparent
            opacity={0.16}
            depthWrite={false}
          />
        </mesh>
      </group>

      {/* =================================================================== */}
      {/* NORTH BAY: BRUSHED-TITANIUM AI SERVER RACKS + AUTONOMOUS DRONE CORE */}
      {/* =================================================================== */}
      <group
        position={[0, 0, -1.42]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectStation('ai_core');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart('ai_core');
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        {/* Twin Brushed-Titanium Liquid-Cooled AI Server Cabinets */}
        {[-1.78, 1.78].map((sx, idx) => (
          <group
            key={idx}
            position={[sx, 0, -0.25]}
            rotation={[0, idx === 0 ? 0.24 : -0.24, 0]}
          >
            <RoundedBox
              args={[0.72, 1.72, 0.62]}
              radius={0.035}
              smoothness={3}
              position={[0, 0.86, 0]}
              castShadow
              receiveShadow
            >
              <meshStandardMaterial
                color="#1e293b"
                bumpMap={metalBump}
                bumpScale={0.009}
                roughness={0.26}
                metalness={0.86}
              />
            </RoundedBox>
            {/* Tempered smoked glass server cabinet door */}
            <mesh position={[0, 0.88, 0.315]}>
              <boxGeometry args={[0.6, 1.54, 0.016]} />
              <meshPhysicalMaterial
                color="#0f172a"
                roughness={0.08}
                metalness={0.15}
                clearcoat={1}
                clearcoatRoughness={0.06}
                transparent
                opacity={0.42}
                depthWrite={false}
              />
            </mesh>
            {/* Horizontal compute blade telemetry LED bars */}
            {[0.32, 0.56, 0.8, 1.04, 1.28, 1.5].map((by, bIdx) => (
              <group key={bIdx} position={[0, by, 0.295]}>
                <mesh>
                  <boxGeometry args={[0.52, 0.08, 0.02]} />
                  <meshStandardMaterial color="#0f172a" roughness={0.4} metalness={0.7} />
                </mesh>
                <mesh position={[0, 0, 0.014]}>
                  <boxGeometry args={[0.42, 0.018, 0.008]} />
                  <meshStandardMaterial
                    color={isToBe ? '#34d399' : '#475569'}
                    emissive={isToBe ? (bIdx % 2 === 0 ? '#10b981' : '#06b6d4') : '#1e293b'}
                    emissiveIntensity={isToBe ? 1.55 : 0.14}
                  />
                </mesh>
              </group>
            ))}
          </group>
        ))}

        {/* Machined Anodized Pedestal & Cooling Ring */}
        <mesh position={[0, 0.12, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[1.05, 1.2, 0.24, 24]} />
          <meshStandardMaterial
            color="#273449"
            bumpMap={metalBump}
            bumpScale={0.008}
            roughness={0.28}
            metalness={0.86}
          />
        </mesh>
        <mesh position={[0, 0.246, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.72, 0.9, 36]} />
          <meshStandardMaterial
            color={isToBe || focusedZone === 'ai_core' ? '#22d3ee' : '#334155'}
            emissive={isToBe || focusedZone === 'ai_core' ? '#10b981' : '#1e293b'}
            emissiveIntensity={isToBe || focusedZone === 'ai_core' ? 1.65 : 0.15}
            side={THREE.DoubleSide}
          />
        </mesh>

        {/* Volumetric-style Translucent Laser Scan Cone (Active in TO_BE) */}
        <mesh ref={scanConeRef} position={[0, 0.72, 0]}>
          <coneGeometry args={[0.85, 1.0, 28, 1, true]} />
          <meshBasicMaterial
            color="#10b981"
            transparent
            opacity={isToBe ? 0.15 : 0}
            side={THREE.DoubleSide}
            depthWrite={false}
          />
        </mesh>

        {/* Levitating Brushed-Titanium Autonomous AI Drone / Optical Core */}
        <group ref={droneCoreRef} position={[0, 1.28, 0]}>
          {/* Machined titanium spherical chassis */}
          <mesh castShadow>
            <sphereGeometry args={[0.34, 24, 24]} />
            <meshPhysicalMaterial
              color="#94a3b8"
              bumpMap={metalBump}
              bumpScale={0.007}
              roughness={0.22}
              metalness={0.92}
              clearcoat={0.65}
              clearcoatRoughness={0.14}
            />
          </mesh>
          {/* Equatorial optical sensor channel */}
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.335, 0.032, 12, 32]} />
            <meshStandardMaterial
              color={isToBe ? '#22d3ee' : '#334155'}
              emissive={isToBe ? '#06b6d4' : '#0f172a'}
              emissiveIntensity={isToBe ? 1.8 : 0.1}
            />
          </mesh>
          {/* Front sapphire optical lens */}
          <mesh position={[0, 0, 0.31]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.12, 0.14, 0.08, 20]} />
            <meshPhysicalMaterial
              color={isToBe ? '#34d399' : '#1e293b'}
              emissive={isToBe ? '#10b981' : '#0f172a'}
              emissiveIntensity={isToBe ? 1.6 : 0.1}
              roughness={0.06}
              clearcoat={1}
            />
          </mesh>
        </group>

        {/* Precision Brushed-Titanium Gimbal Rings */}
        <mesh ref={outerRingRef} position={[0, 1.28, 0]}>
          <torusGeometry args={[0.68, 0.026, 12, 42]} />
          <meshStandardMaterial
            color={isToBe ? '#cbd5e1' : '#475569'}
            emissive={isToBe ? '#10b981' : '#1e293b'}
            emissiveIntensity={isToBe ? 0.95 : 0.08}
            roughness={0.2}
            metalness={0.92}
          />
        </mesh>
        <mesh ref={innerRingRef} position={[0, 1.28, 0]}>
          <torusGeometry args={[0.52, 0.02, 10, 36]} />
          <meshStandardMaterial
            color={isToBe ? '#38bdf8' : '#334155'}
            emissive={isToBe ? '#06b6d4' : '#0f172a'}
            emissiveIntensity={isToBe ? 1.35 : 0.06}
            roughness={0.18}
            metalness={0.88}
          />
        </mesh>

        <pointLight
          ref={coreLightRef}
          position={[0, 1.55, 0]}
          color="#10b981"
          intensity={isToBe ? 4.4 : 0.7}
          distance={8.5}
          decay={2}
        />
      </group>

      {/* =================================================================== */}
      {/* SOUTH OFFICE: EXECUTIVE APPROVAL DESK & BOTTLENECK STAGING PAD      */}
      {/* =================================================================== */}
      <group
        onClick={(e) => {
          e.stopPropagation();
          onSelectStation('approval');
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHoveredPart('approval');
        }}
        onPointerOut={() => setHoveredPart(null)}
      >
        <group position={[0.45, 0, 1.55]}>
          {/* Polished Architectural Walnut & Steel Executive Desk */}
          <RoundedBox
            args={[2.2, 0.09, 1.06]}
            radius={0.028}
            smoothness={3}
            position={[0, 0.74, 0]}
            castShadow
            receiveShadow
          >
            <meshPhysicalMaterial
              color={isToBe ? '#1f293a' : '#443025'}
              roughness={0.38}
              metalness={0.14}
              clearcoat={0.38}
              clearcoatRoughness={0.26}
            />
          </RoundedBox>
          <mesh position={[0, 0.37, -0.44]} castShadow>
            <boxGeometry args={[1.95, 0.68, 0.07]} />
            <meshStandardMaterial
              color={isToBe ? '#141c2b' : '#2d1f18'}
              roughness={0.55}
              metalness={0.18}
            />
          </mesh>
          {[-0.84, 0.84].map((dx, i) => (
            <mesh key={i} position={[dx, 0.36, 0]} castShadow>
              <boxGeometry args={[0.42, 0.7, 0.92]} />
              <meshStandardMaterial
                color={isToBe ? '#182234' : '#31231b'}
                roughness={0.52}
                metalness={0.2}
              />
            </mesh>
          ))}

          {/* Executive High-DPI Monitor */}
          <group position={[-0.45, 1.05, -0.18]} rotation={[0, 0.16, 0]}>
            <mesh position={[0, -0.19, 0]}>
              <cylinderGeometry args={[0.025, 0.032, 0.24, 12]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.22} metalness={0.9} />
            </mesh>
            <RoundedBox args={[0.8, 0.45, 0.038]} radius={0.014} smoothness={2} castShadow>
              <meshStandardMaterial color="#0f172a" roughness={0.28} metalness={0.78} />
            </RoundedBox>
            <mesh position={[0, 0, -0.021]} rotation={[0, Math.PI, 0]}>
              <planeGeometry args={[0.74, 0.4]} />
              <meshPhysicalMaterial
                map={isToBe ? managerIdleScreen : managerAlertScreen}
                emissiveMap={isToBe ? managerIdleScreen : managerAlertScreen}
                emissive="#ffffff"
                emissiveIntensity={isToBe ? 0.42 : 0.95}
                roughness={0.1}
                clearcoat={0.9}
              />
            </mesh>
          </group>

          {/* Physical Approval Binders & Paperwork Stack */}
          <group position={[0.62, 0.8, 0.1]}>
            {(isToBe ? [0] : [0, 1, 2, 3, 4, 5]).map((stack) => (
              <mesh
                key={stack}
                position={[
                  ((stack % 2) - 0.5) * 0.05,
                  stack * 0.045,
                  (stack % 3) * 0.03 - 0.03,
                ]}
                rotation={[0, (stack - 2) * 0.14, 0]}
                castShadow
              >
                <boxGeometry args={[0.34, 0.034, 0.42]} />
                <meshStandardMaterial
                  color={stack % 3 === 0 ? '#cbd5e1' : '#f1f5f9'}
                  roughness={0.82}
                />
              </mesh>
            ))}
          </group>

          {/* Industrial Andon Bottleneck Status Beacon */}
          <group position={[0.94, 0.8, -0.34]}>
            <mesh position={[0, 0.14, 0]}>
              <cylinderGeometry args={[0.032, 0.05, 0.28, 14]} />
              <meshStandardMaterial color="#64748b" roughness={0.25} metalness={0.88} />
            </mesh>
            <mesh ref={warningBeaconRef} position={[0, 0.34, 0]}>
              <cylinderGeometry args={[0.08, 0.08, 0.16, 16]} />
              <meshPhysicalMaterial
                color={isToBe ? '#334155' : '#ef4444'}
                emissive={isToBe ? '#0f172a' : '#f59e0b'}
                emissiveIntensity={isToBe ? 0.05 : 1.45}
                roughness={0.12}
                clearcoat={1}
              />
            </mesh>
          </group>

          {/* Realistic Executive Manager Avatar */}
          <ManagerAvatar
            position={[0, 0, 0.72]}
            rotationY={Math.PI}
            overwhelmed={!isToBe}
          />
        </group>

        {/* Bottleneck Queue Staging Pad */}
        <group position={[-1.3, 0, 1.35]}>
          <RoundedBox
            args={[1.65, 0.08, 1.38]}
            radius={0.035}
            smoothness={3}
            position={[0, 0.04, 0]}
            receiveShadow
          >
            <meshStandardMaterial
              color="#1b2436"
              bumpMap={metalBump}
              bumpScale={0.008}
              roughness={0.44}
              metalness={0.55}
            />
          </RoundedBox>
          <mesh position={[0, 0.085, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.62, 0.72, 4]} />
            <meshStandardMaterial
              color={isToBe ? '#334155' : '#f59e0b'}
              emissive={isToBe ? '#0f172a' : '#ef4444'}
              emissiveIntensity={isToBe ? 0.05 : 1.2}
              side={THREE.DoubleSide}
            />
          </mesh>
          <pointLight
            ref={warningLightRef}
            position={[0, 1.5, 0]}
            color="#f59e0b"
            intensity={isToBe ? 0 : 2.8}
            distance={6.5}
            decay={2}
          />
        </group>
      </group>
    </group>
  );
}
