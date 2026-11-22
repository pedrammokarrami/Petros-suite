import { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import {
  AS_IS_LEG1,
  AS_IS_LEG2,
  TO_BE_LEG1,
  TO_BE_LEG2,
  samplePolyline,
} from '../../simulation/engine';
import type { SimMode, Vec3Tuple } from '../../simulation/types';

interface DataConduitsProps {
  mode: SimMode;
}

function buildTubeGeometry(points: readonly Vec3Tuple[], radius: number, yOffset: number): THREE.TubeGeometry {
  const vectors = points.map((p) => new THREE.Vector3(p.x, p.y + yOffset, p.z));
  const curve = new THREE.CatmullRomCurve3(vectors, false, 'catmullrom', 0.35);
  return new THREE.TubeGeometry(curve, 36, radius, 10, false);
}

const PULSE_COUNT = 5;

/**
 * Glowing floor data-conduits and structural bridge channels connecting
 * Zone 1 -> Zone 2 -> Zone 3 for both the tangled AS-IS path and direct TO-BE AI spline.
 */
export function DataConduits({ mode }: DataConduitsProps) {
  const isToBe = mode === 'TO_BE';

  const geometries = useMemo(() => {
    return {
      asIsLeg1Core: buildTubeGeometry(AS_IS_LEG1, 0.06, -0.10),
      asIsLeg1Track: buildTubeGeometry(AS_IS_LEG1, 0.115, -0.23),
      asIsLeg2Core: buildTubeGeometry(AS_IS_LEG2, 0.06, -0.10),
      asIsLeg2Track: buildTubeGeometry(AS_IS_LEG2, 0.115, -0.23),
      toBeLeg1Core: buildTubeGeometry(TO_BE_LEG1, 0.072, -0.09),
      toBeLeg1Track: buildTubeGeometry(TO_BE_LEG1, 0.125, -0.22),
      toBeLeg2Core: buildTubeGeometry(TO_BE_LEG2, 0.072, -0.09),
      toBeLeg2Track: buildTubeGeometry(TO_BE_LEG2, 0.125, -0.22),
    };
  }, []);

  useEffect(() => {
    return () => {
      Object.values(geometries).forEach((g) => g.dispose());
    };
  }, [geometries]);

  const pulsesLeg1Ref = useRef<THREE.Group>(null);
  const pulsesLeg2Ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const flowRate = isToBe ? 0.58 : 0.18;
    const leg1Path = isToBe ? TO_BE_LEG1 : AS_IS_LEG1;
    const leg2Path = isToBe ? TO_BE_LEG2 : AS_IS_LEG2;

    if (pulsesLeg1Ref.current) {
      pulsesLeg1Ref.current.children.forEach((child, idx) => {
        const u = ((t * flowRate) + idx / PULSE_COUNT) % 1;
        const sampled = samplePolyline(leg1Path, u);
        child.position.set(sampled.position.x, sampled.position.y - 0.07, sampled.position.z);
      });
    }
    if (pulsesLeg2Ref.current) {
      pulsesLeg2Ref.current.children.forEach((child, idx) => {
        const u = ((t * flowRate) + idx / PULSE_COUNT + 0.35) % 1;
        const sampled = samplePolyline(leg2Path, u);
        child.position.set(sampled.position.x, sampled.position.y - 0.07, sampled.position.z);
      });
    }
  });

  return (
    <group>
      {/* =================================================================== */}
      {/* AS-IS TANGLED CONDUIT PATH (Amber/Red active in AS-IS, dimmed TO-BE)*/}
      {/* =================================================================== */}
      <mesh geometry={geometries.asIsLeg1Track} receiveShadow>
        <meshStandardMaterial
          color="#131b2b"
          roughness={0.52}
          metalness={0.6}
          transparent={isToBe}
          opacity={isToBe ? 0.25 : 1}
        />
      </mesh>
      <mesh geometry={geometries.asIsLeg2Track} receiveShadow>
        <meshStandardMaterial
          color="#131b2b"
          roughness={0.52}
          metalness={0.6}
          transparent={isToBe}
          opacity={isToBe ? 0.25 : 1}
        />
      </mesh>

      <mesh geometry={geometries.asIsLeg1Core}>
        <meshStandardMaterial
          color={isToBe ? '#334155' : '#f59e0b'}
          emissive={isToBe ? '#1e293b' : '#f59e0b'}
          emissiveIntensity={isToBe ? 0.12 : 1.15}
          transparent={isToBe}
          opacity={isToBe ? 0.22 : 1}
          roughness={0.25}
        />
      </mesh>
      <mesh geometry={geometries.asIsLeg2Core}>
        <meshStandardMaterial
          color={isToBe ? '#334155' : '#f59e0b'}
          emissive={isToBe ? '#1e293b' : '#ea580c'}
          emissiveIntensity={isToBe ? 0.12 : 0.95}
          transparent={isToBe}
          opacity={isToBe ? 0.22 : 1}
          roughness={0.25}
        />
      </mesh>

      {/* =================================================================== */}
      {/* TO-BE DIRECT AI CONDUIT PATH (Cyan/Emerald active in TO-BE)         */}
      {/* =================================================================== */}
      <mesh geometry={geometries.toBeLeg1Track} receiveShadow>
        <meshStandardMaterial
          color="#131d2d"
          roughness={0.44}
          metalness={0.68}
          transparent={!isToBe}
          opacity={isToBe ? 1 : 0.35}
        />
      </mesh>
      <mesh geometry={geometries.toBeLeg2Track} receiveShadow>
        <meshStandardMaterial
          color="#131d2d"
          roughness={0.44}
          metalness={0.68}
          transparent={!isToBe}
          opacity={isToBe ? 1 : 0.35}
        />
      </mesh>

      <mesh geometry={geometries.toBeLeg1Core}>
        <meshStandardMaterial
          color={isToBe ? '#22d3ee' : '#1e293b'}
          emissive={isToBe ? '#06b6d4' : '#0f172a'}
          emissiveIntensity={isToBe ? 1.55 : 0.15}
          transparent={!isToBe}
          opacity={isToBe ? 1 : 0.28}
          roughness={0.2}
        />
      </mesh>
      <mesh geometry={geometries.toBeLeg2Core}>
        <meshStandardMaterial
          color={isToBe ? '#34d399' : '#1e293b'}
          emissive={isToBe ? '#10b981' : '#0f172a'}
          emissiveIntensity={isToBe ? 1.6 : 0.15}
          transparent={!isToBe}
          opacity={isToBe ? 1 : 0.28}
          roughness={0.2}
        />
      </mesh>

      {/* Animated data-flow beads along active conduit legs */}
      <group ref={pulsesLeg1Ref}>
        {Array.from({ length: PULSE_COUNT }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial
              color={isToBe ? '#67e8f9' : '#fde68a'}
              emissive={isToBe ? '#06b6d4' : '#f59e0b'}
              emissiveIntensity={2.0}
            />
          </mesh>
        ))}
      </group>
      <group ref={pulsesLeg2Ref}>
        {Array.from({ length: PULSE_COUNT }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.08, 10, 10]} />
            <meshStandardMaterial
              color={isToBe ? '#6ee7b7' : '#fdba74'}
              emissive={isToBe ? '#10b981' : '#ea580c'}
              emissiveIntensity={2.0}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
