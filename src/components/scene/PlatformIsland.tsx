import { useEffect, useMemo } from 'react';
import { RoundedBox } from '@react-three/drei';
import {
  createBrushedMetalBumpMap,
  createEpoxyFloorTextures,
} from '../../utils/webgl';

interface PlatformIslandProps {
  position: [number, number, number];
  size: [number, number, number];
  accentColor: string;
  trimEmissiveIntensity?: number;
  glassPartition?: 'none' | 'back' | 'back-left';
  partitionHeight?: number;
}

/**
 * Photorealistic architectural refinery/control-center platform island with
 * PBR brushed concrete/epoxy top deck, anodized aluminum curbing, bolted steel
 * sub-chassis, and optional tempered-glass architectural partition wall.
 */
export function PlatformIsland({
  position,
  size,
  accentColor,
  trimEmissiveIntensity = 0.75,
  glassPartition = 'none',
  partitionHeight = 2.05,
}: PlatformIslandProps) {
  const [width, height, depth] = size;

  const floorMaps = useMemo(
    () => createEpoxyFloorTextures(accentColor),
    [accentColor]
  );
  const metalBump = useMemo(() => createBrushedMetalBumpMap(), []);

  useEffect(() => {
    return () => {
      floorMaps.map.dispose();
      floorMaps.bumpMap.dispose();
      floorMaps.roughnessMap.dispose();
      metalBump.dispose();
    };
  }, [floorMaps, metalBump]);

  const mullionCount = Math.max(3, Math.round(width / 1.4) + 1);

  return (
    <group position={position}>
      {/* Main beveled architectural concrete & aluminum slab (top flush at y = 0) */}
      <RoundedBox
        args={[width, height, depth]}
        radius={0.11}
        smoothness={4}
        position={[0, -height / 2, 0]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial
          color="#1c2536"
          bumpMap={metalBump}
          bumpScale={0.008}
          roughness={0.42}
          metalness={0.58}
        />
      </RoundedBox>

      {/* Recessed brushed dark-titanium structural I-beam sub-chassis */}
      <RoundedBox
        args={[width - 0.3, 0.24, depth - 0.3]}
        radius={0.06}
        smoothness={3}
        position={[0, -height - 0.1, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#0f1623"
          bumpMap={metalBump}
          bumpScale={0.01}
          roughness={0.32}
          metalness={0.82}
        />
      </RoundedBox>

      {/* Subtle architectural LED perimeter light channel */}
      <mesh position={[0, -height + 0.045, 0]}>
        <boxGeometry args={[width + 0.028, 0.04, depth + 0.028]} />
        <meshStandardMaterial
          color={accentColor}
          emissive={accentColor}
          emissiveIntensity={trimEmissiveIntensity}
          roughness={0.22}
          metalness={0.15}
        />
      </mesh>

      {/* PBR Brushed Concrete / Epoxy Top Deck with Satin Specular Sheen */}
      <mesh
        position={[0, 0.007, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[width - 0.22, depth - 0.22]} />
        <meshPhysicalMaterial
          map={floorMaps.map}
          bumpMap={floorMaps.bumpMap}
          bumpScale={0.02}
          roughnessMap={floorMaps.roughnessMap}
          roughness={0.82}
          metalness={0.1}
          clearcoat={0.12}
          clearcoatRoughness={0.48}
          envMapIntensity={0.42}
          polygonOffset
          polygonOffsetFactor={-1}
        />
      </mesh>

      {/* Brushed Anodized Aluminum Corner Bumper Columns */}
      {[
        [-width / 2 + 0.13, -height / 2, -depth / 2 + 0.13],
        [width / 2 - 0.13, -height / 2, -depth / 2 + 0.13],
        [-width / 2 + 0.13, -height / 2, depth / 2 - 0.13],
        [width / 2 - 0.13, -height / 2, depth / 2 - 0.13],
      ].map(([cx, cy, cz], idx) => (
        <mesh key={idx} position={[cx, cy, cz]}>
          <cylinderGeometry args={[0.095, 0.115, height + 0.025, 16]} />
          <meshStandardMaterial
            color="#64748b"
            bumpMap={metalBump}
            bumpScale={0.008}
            roughness={0.26}
            metalness={0.88}
          />
        </mesh>
      ))}

      {/* Architectural Tempered Glass Partition Wall with Anodized Aluminum Mullions */}
      {glassPartition !== 'none' && (
        <group position={[0, 0, -depth / 2 + 0.18]}>
          {/* Bottom brushed-aluminum floor track */}
          <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
            <boxGeometry args={[width - 0.42, 0.08, 0.09]} />
            <meshStandardMaterial
              color="#475569"
              bumpMap={metalBump}
              bumpScale={0.006}
              roughness={0.28}
              metalness={0.86}
            />
          </mesh>

          {/* Top brushed-aluminum header beam */}
          <mesh position={[0, partitionHeight, 0]} castShadow>
            <boxGeometry args={[width - 0.36, 0.085, 0.1]} />
            <meshStandardMaterial
              color="#64748b"
              bumpMap={metalBump}
              bumpScale={0.006}
              roughness={0.25}
              metalness={0.88}
            />
          </mesh>

          {/* Slim recessed architectural overhead LED light bar */}
          <mesh position={[0, partitionHeight - 0.048, 0.035]}>
            <boxGeometry args={[width - 0.64, 0.018, 0.02]} />
            <meshStandardMaterial
              color="#e2e8f0"
              emissive={accentColor}
              emissiveIntensity={0.95}
              roughness={0.2}
            />
          </mesh>

          {/* Vertical anodized aluminum mullions */}
          {Array.from({ length: mullionCount }).map((_, idx) => {
            const t = mullionCount === 1 ? 0.5 : idx / (mullionCount - 1);
            const mx = -(width - 0.46) / 2 + t * (width - 0.46);
            return (
              <mesh
                key={idx}
                position={[mx, partitionHeight / 2, 0]}
                castShadow
              >
                <boxGeometry args={[0.055, partitionHeight, 0.075]} />
                <meshStandardMaterial
                  color="#475569"
                  bumpMap={metalBump}
                  bumpScale={0.006}
                  roughness={0.26}
                  metalness={0.88}
                />
              </mesh>
            );
          })}

          {/* Specular Tempered Architectural Glass Pane (Zero extra pass cost) */}
          <mesh position={[0, partitionHeight / 2, 0]}>
            <boxGeometry args={[width - 0.5, partitionHeight - 0.12, 0.022]} />
            <meshPhysicalMaterial
              color="#93c5fd"
              roughness={0.06}
              metalness={0.08}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              reflectivity={0.95}
              envMapIntensity={1.6}
              transparent
              opacity={0.18}
              depthWrite={false}
            />
          </mesh>

          {/* Frosted architectural privacy stripe across glass mid-band */}
          <mesh position={[0, partitionHeight * 0.52, 0.014]}>
            <planeGeometry args={[width - 0.56, 0.24]} />
            <meshStandardMaterial
              color="#cbd5e1"
              roughness={0.45}
              metalness={0.1}
              transparent
              opacity={0.14}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}

      {/* Optional Left Side Glass Return Panel (for Control Room corner feel) */}
      {glassPartition === 'back-left' && (
        <group
          position={[-width / 2 + 0.18, 0, -depth * 0.12]}
          rotation={[0, Math.PI / 2, 0]}
        >
          <mesh position={[0, 0.04, 0]} castShadow>
            <boxGeometry args={[depth * 0.68, 0.08, 0.08]} />
            <meshStandardMaterial color="#475569" roughness={0.28} metalness={0.86} />
          </mesh>
          <mesh position={[0, partitionHeight, 0]} castShadow>
            <boxGeometry args={[depth * 0.68, 0.085, 0.095]} />
            <meshStandardMaterial color="#64748b" roughness={0.25} metalness={0.88} />
          </mesh>
          {[-depth * 0.32, 0, depth * 0.32].map((mx, idx) => (
            <mesh key={idx} position={[mx, partitionHeight / 2, 0]} castShadow>
              <boxGeometry args={[0.055, partitionHeight, 0.07]} />
              <meshStandardMaterial color="#475569" roughness={0.26} metalness={0.88} />
            </mesh>
          ))}
          <mesh position={[0, partitionHeight / 2, 0]}>
            <boxGeometry args={[depth * 0.64, partitionHeight - 0.12, 0.022]} />
            <meshPhysicalMaterial
              color="#93c5fd"
              roughness={0.06}
              metalness={0.08}
              clearcoat={1.0}
              clearcoatRoughness={0.05}
              reflectivity={0.95}
              envMapIntensity={1.6}
              transparent
              opacity={0.16}
              depthWrite={false}
            />
          </mesh>
        </group>
      )}
    </group>
  );
}
