import { useEffect, useMemo, useState } from 'react';
import { RoundedBox } from '@react-three/drei';
import { PlatformIsland } from './PlatformIsland';
import { EmployeeAvatar } from './Avatars';
import {
  createBrushedMetalBumpMap,
  createMonitorScreenTexture,
} from '../../utils/webgl';
import type { SimMode } from '../../simulation/types';

interface ZoneIntakeProps {
  mode: SimMode;
  isFocused?: boolean;
  onSelectStation: () => void;
}

/**
 * Zone 1 (Left): Request & Intake Control Bay.
 * Architectural glass partition corner, walnut & anodized-aluminum control desk,
 * articulated dual SCADA displays, realistic Operations Engineer, and laser document intake pad.
 */
export function ZoneIntake({
  mode,
  isFocused = false,
  onSelectStation,
}: ZoneIntakeProps) {
  const screenTexture = useMemo(() => createMonitorScreenTexture('intake'), []);
  const metalBump = useMemo(() => createBrushedMetalBumpMap(), []);
  const accentColor = mode === 'TO_BE' ? '#06b6d4' : '#38bdf8';
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    document.body.style.cursor = hovered ? 'pointer' : 'auto';
    return () => {
      document.body.style.cursor = 'auto';
    };
  }, [hovered]);

  useEffect(() => {
    return () => {
      screenTexture.dispose();
      metalBump.dispose();
    };
  }, [screenTexture, metalBump]);

  return (
    <group
      position={[-6.0, 0, 0]}
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
        size={[4.4, 0.55, 4.6]}
        accentColor={isFocused || hovered ? '#22d3ee' : accentColor}
        trimEmissiveIntensity={isFocused || hovered ? 1.35 : 0.78}
        glassPartition="back-left"
        partitionHeight={2.0}
      />

      {/* Overhead studio key & subtle volumetric accent */}
      <pointLight
        position={[0, 2.9, 0.4]}
        color={accentColor}
        intensity={2.4}
        distance={7.5}
        decay={2}
      />

      {/* Ergonomic Industrial Control Workstation Desk */}
      <group position={[-0.4, 0, -0.55]}>
        <RoundedBox
          args={[2.18, 0.07, 1.04]}
          radius={0.025}
          smoothness={3}
          position={[0, 0.74, 0]}
          castShadow
          receiveShadow
        >
          <meshPhysicalMaterial
            color="#222b3a"
            roughness={0.38}
            metalness={0.18}
            clearcoat={0.28}
            clearcoatRoughness={0.32}
          />
        </RoundedBox>
        <mesh position={[0, 0.78, 0.24]} receiveShadow>
          <boxGeometry args={[1.38, 0.01, 0.42]} />
          <meshStandardMaterial color="#111827" roughness={0.76} metalness={0.06} />
        </mesh>
        {[-0.95, 0.95].map((lx, i) => (
          <group key={i} position={[lx, 0, 0]}>
            <mesh position={[0, 0.36, -0.36]} castShadow>
              <boxGeometry args={[0.065, 0.72, 0.065]} />
              <meshStandardMaterial
                color="#94a3b8"
                bumpMap={metalBump}
                bumpScale={0.008}
                roughness={0.24}
                metalness={0.9}
              />
            </mesh>
            <mesh position={[0, 0.36, 0.36]} castShadow>
              <boxGeometry args={[0.065, 0.72, 0.065]} />
              <meshStandardMaterial
                color="#94a3b8"
                bumpMap={metalBump}
                bumpScale={0.008}
                roughness={0.24}
                metalness={0.9}
              />
            </mesh>
            <mesh position={[0, 0.04, 0]} castShadow>
              <boxGeometry args={[0.075, 0.05, 0.84]} />
              <meshStandardMaterial color="#64748b" roughness={0.26} metalness={0.88} />
            </mesh>
          </group>
        ))}

        {/* Dual Angled High-DPI SCADA Displays on Brushed Aluminum Arms */}
        {[-0.45, 0.45].map((mx, idx) => (
          <group
            key={idx}
            position={[mx, 1.07, -0.24]}
            rotation={[0, idx === 0 ? 0.16 : -0.16, 0]}
          >
            <mesh position={[0, -0.2, -0.055]} castShadow>
              <cylinderGeometry args={[0.024, 0.028, 0.32, 12]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.22} metalness={0.9} />
            </mesh>
            <RoundedBox args={[0.8, 0.47, 0.036]} radius={0.014} smoothness={2} castShadow>
              <meshStandardMaterial color="#0f172a" roughness={0.28} metalness={0.78} />
            </RoundedBox>
            <mesh position={[0, 0, 0.02]}>
              <planeGeometry args={[0.75, 0.42]} />
              <meshPhysicalMaterial
                map={screenTexture}
                emissiveMap={screenTexture}
                emissive="#ffffff"
                emissiveIntensity={0.88}
                roughness={0.1}
                clearcoat={0.9}
                clearcoatRoughness={0.08}
              />
            </mesh>
          </group>
        ))}

        {/* Slim Aluminum Keyboard & Ergonomic Mouse */}
        <RoundedBox args={[0.52, 0.018, 0.17]} radius={0.006} smoothness={2} position={[-0.08, 0.794, 0.22]}>
          <meshStandardMaterial color="#cbd5e1" roughness={0.3} metalness={0.75} />
        </RoundedBox>
        <RoundedBox args={[0.08, 0.022, 0.12]} radius={0.01} smoothness={2} position={[0.3, 0.796, 0.24]}>
          <meshStandardMaterial color="#e2e8f0" roughness={0.25} metalness={0.65} />
        </RoundedBox>

        {/* Precision Brushed-Aluminum Architectural Task Lamp */}
        <group position={[-0.92, 0.78, -0.26]}>
          <mesh position={[0, 0.018, 0]}>
            <cylinderGeometry args={[0.085, 0.095, 0.036, 16]} />
            <meshStandardMaterial color="#475569" roughness={0.24} metalness={0.88} />
          </mesh>
          <mesh position={[0.04, 0.23, 0.04]} rotation={[0.18, 0, -0.18]}>
            <cylinderGeometry args={[0.014, 0.018, 0.44, 10]} />
            <meshStandardMaterial color="#94a3b8" roughness={0.22} metalness={0.9} />
          </mesh>
          <mesh position={[0.11, 0.43, 0.08]} rotation={[0.2, 0, -0.32]}>
            <boxGeometry args={[0.24, 0.026, 0.065]} />
            <meshStandardMaterial
              color="#fef9c3"
              emissive="#fde68a"
              emissiveIntensity={1.15}
            />
          </mesh>
        </group>
      </group>

      {/* Realistic Seated Operations Engineer facing monitors */}
      <EmployeeAvatar
        position={[-0.4, 0, 0.26]}
        rotationY={Math.PI}
        shirtColor="#1d4ed8"
      />

      {/* Smart Optical Intake Tray & Package Dispatch Pad */}
      <group position={[1.15, 0, 0.55]}>
        <RoundedBox
          args={[1.14, 0.16, 1.18]}
          radius={0.045}
          smoothness={3}
          position={[0, 0.08, 0]}
          castShadow
          receiveShadow
        >
          <meshStandardMaterial
            color="#1e293b"
            bumpMap={metalBump}
            bumpScale={0.008}
            roughness={0.36}
            metalness={0.72}
          />
        </RoundedBox>
        <mesh position={[0, 0.168, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.32, 0.42, 32]} />
          <meshStandardMaterial
            color={accentColor}
            emissive={accentColor}
            emissiveIntensity={1.25}
            side={2}
          />
        </mesh>
        {[0, 1, 2, 3].map((sheet) => (
          <mesh
            key={sheet}
            position={[-0.36, 0.18 + sheet * 0.032, -0.34]}
            rotation={[0, (sheet - 1.5) * 0.06, 0]}
            castShadow
          >
            <boxGeometry args={[0.26, 0.02, 0.34]} />
            <meshStandardMaterial color="#f1f5f9" roughness={0.82} metalness={0.02} />
          </mesh>
        ))}
      </group>

      {/* Architectural Concrete & Brushed-Steel Planter */}
      <group position={[-1.6, 0, 1.62]}>
        <RoundedBox args={[0.56, 0.44, 0.56]} radius={0.04} smoothness={3} position={[0, 0.22, 0]} castShadow>
          <meshStandardMaterial color="#273244" roughness={0.52} metalness={0.32} />
        </RoundedBox>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.46, 0.03, 0.46]} />
          <meshStandardMaterial color="#261c17" roughness={0.95} />
        </mesh>
        {[
          { pos: [0, 0.68, 0] as [number, number, number], r: 0.2, c: '#15803d' },
          { pos: [0.13, 0.82, -0.05] as [number, number, number], r: 0.14, c: '#16a34a' },
          { pos: [-0.11, 0.78, 0.08] as [number, number, number], r: 0.13, c: '#166534' },
        ].map((leaf, i) => (
          <mesh key={i} position={leaf.pos} castShadow>
            <icosahedronGeometry args={[leaf.r, 1]} />
            <meshStandardMaterial color={leaf.c} roughness={0.72} metalness={0.04} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
