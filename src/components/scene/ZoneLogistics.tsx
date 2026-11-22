import { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';
import { PlatformIsland } from './PlatformIsland';
import { LogisticsAvatar } from './Avatars';
import {
  createBrushedMetalBumpMap,
  createCorrugatedCrateTexture,
} from '../../utils/webgl';
import type { SimMode, SimState } from '../../simulation/types';

interface ZoneLogisticsProps {
  mode: SimMode;
  simRef: React.MutableRefObject<SimState>;
  isFocused?: boolean;
  onSelectStation: () => void;
}

const ROLLER_COUNT = 16;
const CONVEYOR_LEN = 3.95;

interface CrateSpec {
  pos: [number, number, number];
  size: [number, number, number];
  kind: 'cardboard' | 'polymer';
}

/**
 * Zone 3 (Right): Automated Industrial Logistics & Warehouse Bay.
 * Rotating brushed-steel cylindrical conveyor rollers, optical RFID laser arch,
 * heavy bolted industrial steel racking with safety crossbeams, textured shipping crates
 * and polymer totes, and realistic Logistics Specialist.
 */
export function ZoneLogistics({
  mode,
  simRef,
  isFocused = false,
  onSelectStation,
}: ZoneLogisticsProps) {
  const isToBe = mode === 'TO_BE';
  const accentColor = isToBe ? '#10b981' : '#64748b';
  const rollersGroupRef = useRef<THREE.Group>(null);
  const [hovered, setHovered] = useState(false);

  const metalBump = useMemo(() => createBrushedMetalBumpMap(), []);
  const cardboardTex = useMemo(() => createCorrugatedCrateTexture('cardboard'), []);
  const polymerTex = useMemo(() => createCorrugatedCrateTexture('polymer'), []);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  useEffect(() => {
    return () => {
      metalBump.dispose();
      cardboardTex.dispose();
      polymerTex.dispose();
    };
  }, [metalBump, cardboardTex, polymerTex]);

  const crates = useMemo<CrateSpec[]>(
    () => [
      { pos: [-1.42, 0.72, -1.55], size: [0.48, 0.34, 0.44], kind: 'cardboard' },
      { pos: [-0.88, 0.74, -1.52], size: [0.44, 0.38, 0.42], kind: 'cardboard' },
      { pos: [-0.36, 0.69, -1.56], size: [0.42, 0.28, 0.4], kind: 'polymer' },
      { pos: [-1.36, 1.42, -1.54], size: [0.5, 0.36, 0.42], kind: 'cardboard' },
      { pos: [-0.74, 1.38, -1.55], size: [0.52, 0.28, 0.44], kind: 'polymer' },
      { pos: [-1.18, 2.08, -1.54], size: [0.46, 0.32, 0.4], kind: 'cardboard' },
      { pos: [-0.52, 2.06, -1.55], size: [0.42, 0.28, 0.42], kind: 'cardboard' },
      { pos: [0.52, 0.73, -1.54], size: [0.48, 0.36, 0.44], kind: 'cardboard' },
      { pos: [1.08, 0.7, -1.55], size: [0.46, 0.3, 0.42], kind: 'polymer' },
      { pos: [1.58, 0.74, -1.54], size: [0.42, 0.38, 0.42], kind: 'cardboard' },
      { pos: [0.64, 1.4, -1.55], size: [0.54, 0.32, 0.42], kind: 'cardboard' },
      { pos: [1.34, 1.42, -1.54], size: [0.52, 0.36, 0.42], kind: 'polymer' },
      { pos: [0.95, 2.09, -1.54], size: [0.5, 0.34, 0.42], kind: 'cardboard' },
    ],
    []
  );

  // Spin each brushed-steel cylindrical roller smoothly in sync with conveyor throughput
  useFrame(() => {
    if (!rollersGroupRef.current) return;
    const spinAngle = -simRef.current.conveyorOffset * Math.PI * 10;
    rollersGroupRef.current.children.forEach((child) => {
      child.rotation.z = spinAngle;
    });
  });

  return (
    <group
      position={[6.0, 0, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onSelectStation();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <PlatformIsland
        position={[0, 0, 0]}
        size={[4.8, 0.55, 5.0]}
        accentColor={isFocused || hovered ? '#22d3ee' : accentColor}
        trimEmissiveIntensity={isFocused || hovered ? 1.35 : isToBe ? 0.95 : 0.48}
        glassPartition="none"
      />

      <pointLight
        position={[0.2, 3.0, 0.5]}
        color={isToBe ? '#10b981' : '#cbd5e1'}
        intensity={isToBe ? 3.2 : 1.7}
        distance={8.5}
        decay={2}
      />

      {/* Heavy-Duty Industrial Roller Conveyor Assembly */}
      <group position={[-0.2, 0, 0.55]}>
        {/* Bolted steel floor stanchions */}
        {[-1.72, 0, 1.72].map((lx, idx) => (
          <group key={idx} position={[lx, 0.2, 0]}>
            <mesh position={[0, 0, -0.44]} castShadow>
              <boxGeometry args={[0.09, 0.4, 0.08]} />
              <meshStandardMaterial
                color="#475569"
                bumpMap={metalBump}
                bumpScale={0.008}
                roughness={0.3}
                metalness={0.86}
              />
            </mesh>
            <mesh position={[0, 0, 0.44]} castShadow>
              <boxGeometry args={[0.09, 0.4, 0.08]} />
              <meshStandardMaterial
                color="#475569"
                bumpMap={metalBump}
                bumpScale={0.008}
                roughness={0.3}
                metalness={0.86}
              />
            </mesh>
            {/* Cross brace */}
            <mesh position={[0, -0.06, 0]}>
              <boxGeometry args={[0.06, 0.05, 0.84]} />
              <meshStandardMaterial color="#334155" roughness={0.35} metalness={0.82} />
            </mesh>
          </group>
        ))}

        {/* Under-conveyor dark industrial bed */}
        <RoundedBox
          args={[CONVEYOR_LEN + 0.16, 0.11, 0.94]}
          radius={0.025}
          smoothness={2}
          position={[0, 0.36, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color="#151e2e" roughness={0.48} metalness={0.68} />
        </RoundedBox>

        {/* 16 Individual Rotating Brushed-Steel Cylindrical Rollers */}
        <group ref={rollersGroupRef} position={[0, 0.445, 0]}>
          {Array.from({ length: ROLLER_COUNT }).map((_, i) => {
            const spacing = (CONVEYOR_LEN - 0.18) / (ROLLER_COUNT - 1);
            const rx = -(CONVEYOR_LEN - 0.18) / 2 + i * spacing;
            return (
              <mesh
                key={i}
                position={[rx, 0, 0]}
                rotation={[Math.PI / 2, 0, 0]}
                castShadow
                receiveShadow
              >
                <cylinderGeometry args={[0.042, 0.042, 0.8, 12]} />
                <meshStandardMaterial
                  color="#94a3b8"
                  bumpMap={metalBump}
                  bumpScale={0.01}
                  roughness={0.22}
                  metalness={0.92}
                />
              </mesh>
            );
          })}
        </group>

        {/* Anodized Aluminum Side Guard Channels + Illuminated Status Strips */}
        {[-0.47, 0.47].map((rz, idx) => (
          <group key={idx} position={[0, 0.48, rz]}>
            <mesh castShadow>
              <boxGeometry args={[CONVEYOR_LEN + 0.14, 0.1, 0.065]} />
              <meshStandardMaterial
                color="#64748b"
                bumpMap={metalBump}
                bumpScale={0.008}
                roughness={0.25}
                metalness={0.88}
              />
            </mesh>
            <mesh position={[0, 0.056, 0]}>
              <boxGeometry args={[CONVEYOR_LEN, 0.02, 0.026]} />
              <meshStandardMaterial
                color={isToBe ? '#10b981' : '#f59e0b'}
                emissive={isToBe ? '#10b981' : '#f59e0b'}
                emissiveIntensity={isToBe ? 1.25 : 0.35}
              />
            </mesh>
          </group>
        ))}

        {/* End Optical RFID Dispatch Scanner Arch */}
        <group position={[1.82, 0.46, 0]}>
          <mesh position={[0, 0.46, -0.49]} castShadow>
            <boxGeometry args={[0.16, 0.92, 0.11]} />
            <meshStandardMaterial color="#334155" roughness={0.28} metalness={0.84} />
          </mesh>
          <mesh position={[0, 0.46, 0.49]} castShadow>
            <boxGeometry args={[0.16, 0.92, 0.11]} />
            <meshStandardMaterial color="#334155" roughness={0.28} metalness={0.84} />
          </mesh>
          <mesh position={[0, 0.9, 0]} castShadow>
            <boxGeometry args={[0.2, 0.14, 1.12]} />
            <meshStandardMaterial color="#475569" roughness={0.25} metalness={0.88} />
          </mesh>
          <mesh position={[0, 0.8, 0]}>
            <boxGeometry args={[0.04, 0.025, 0.88]} />
            <meshStandardMaterial
              color={isToBe ? '#34d399' : '#fbbf24'}
              emissive={isToBe ? '#10b981' : '#f59e0b'}
              emissiveIntensity={isToBe ? 1.85 : 0.45}
            />
          </mesh>
          {/* Subtle translucent laser scan curtain active in TO-BE */}
          {isToBe && (
            <mesh position={[0, 0.42, 0]}>
              <planeGeometry args={[0.02, 0.72]} />
              <meshBasicMaterial
                color="#10b981"
                transparent
                opacity={0.22}
                side={THREE.DoubleSide}
                depthWrite={false}
              />
            </mesh>
          )}
        </group>
      </group>

      {/* Heavy Bolted Industrial Warehouse Steel Shelving Racks */}
      {[-0.88, 1.04].map((rackX, rIdx) => (
        <group key={rIdx} position={[rackX, 0, -1.55]}>
          {/* Steel vertical upright columns */}
          {[
            [-0.82, 1.16, -0.28],
            [0.82, 1.16, -0.28],
            [-0.82, 1.16, 0.28],
            [0.82, 1.16, 0.28],
          ].map(([px, py, pz], pIdx) => (
            <mesh key={pIdx} position={[px, py, pz]} castShadow>
              <boxGeometry args={[0.065, 2.32, 0.065]} />
              <meshStandardMaterial
                color="#64748b"
                bumpMap={metalBump}
                bumpScale={0.008}
                roughness={0.28}
                metalness={0.88}
              />
            </mesh>
          ))}
          {/* Horizontal decks with industrial safety-amber front load beams */}
          {[0.54, 1.22, 1.9].map((sy, sIdx) => (
            <group key={sIdx} position={[0, sy, 0]}>
              <mesh castShadow receiveShadow>
                <boxGeometry args={[1.68, 0.045, 0.6]} />
                <meshStandardMaterial color="#1e293b" roughness={0.48} metalness={0.68} />
              </mesh>
              <mesh position={[0, 0, 0.305]}>
                <boxGeometry args={[1.7, 0.055, 0.025]} />
                <meshStandardMaterial
                  color="#d97706"
                  roughness={0.38}
                  metalness={0.45}
                />
              </mesh>
            </group>
          ))}
        </group>
      ))}

      {/* Textured Corrugated Shipping Crates & Industrial Polymer Totes */}
      {crates.map((crate, i) => (
        <RoundedBox
          key={i}
          args={crate.size}
          radius={0.02}
          smoothness={2}
          position={crate.pos}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            map={crate.kind === 'cardboard' ? cardboardTex : polymerTex}
            roughness={crate.kind === 'cardboard' ? 0.82 : 0.42}
            metalness={crate.kind === 'cardboard' ? 0.04 : 0.22}
          />
        </RoundedBox>
      ))}

      {/* Realistic Standing Industrial Logistics Specialist */}
      <LogisticsAvatar
        position={[-0.1, 0, 1.72]}
        rotationY={Math.PI}
        isFastMode={isToBe}
      />
    </group>
  );
}
