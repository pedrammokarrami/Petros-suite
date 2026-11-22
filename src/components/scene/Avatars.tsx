import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

interface BaseAvatarProps {
  position: [number, number, number];
  rotationY?: number;
}

interface EmployeeAvatarProps extends BaseAvatarProps {
  shirtColor?: string;
}

interface ManagerAvatarProps extends BaseAvatarProps {
  overwhelmed: boolean;
}

interface LogisticsAvatarProps extends BaseAvatarProps {
  isFastMode: boolean;
}

/**
 * Shared photorealistic ergonomic mesh-back executive/control-room task chair
 * with brushed-aluminum 5-star caster base, gas lift cylinder, and armrests.
 */
function ErgonomicTaskChair({ executive = false }: { executive?: boolean }) {
  const backrestHeight = executive ? 0.62 : 0.48;
  const seatColor = executive ? '#1a202c' : '#1e293b';

  return (
    <group position={[0, 0, -0.02]}>
      {/* 5-star brushed aluminum caster spider */}
      {[0, 1, 2, 3, 4].map((i) => {
        const angle = (i * Math.PI * 2) / 5;
        return (
          <group key={i} rotation={[0, angle, 0]}>
            <mesh position={[0.14, 0.06, 0]} rotation={[0, 0, -0.18]} castShadow>
              <boxGeometry args={[0.28, 0.028, 0.032]} />
              <meshStandardMaterial color="#94a3b8" roughness={0.22} metalness={0.9} />
            </mesh>
            <mesh position={[0.26, 0.024, 0]}>
              <cylinderGeometry args={[0.024, 0.024, 0.022, 10]} />
              <meshStandardMaterial color="#0f172a" roughness={0.7} metalness={0.2} />
            </mesh>
          </group>
        );
      })}
      {/* Pneumatic lift cylinder */}
      <mesh position={[0, 0.24, 0]} castShadow>
        <cylinderGeometry args={[0.032, 0.038, 0.36, 12]} />
        <meshStandardMaterial color="#334155" roughness={0.28} metalness={0.86} />
      </mesh>
      {/* Contoured seat cushion */}
      <RoundedBox
        args={[0.48, 0.075, 0.46]}
        radius={0.03}
        smoothness={3}
        position={[0, 0.44, 0.02]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial color={seatColor} roughness={0.68} metalness={0.08} />
      </RoundedBox>
      {/* Sculpted lumbar backrest with aluminum spine */}
      <mesh position={[0, 0.46 + backrestHeight / 2, -0.22]} rotation={[-0.08, 0, 0]} castShadow>
        <boxGeometry args={[0.07, backrestHeight * 0.9, 0.035]} />
        <meshStandardMaterial color="#64748b" roughness={0.25} metalness={0.88} />
      </mesh>
      <RoundedBox
        args={[0.44, backrestHeight, 0.055]}
        radius={0.025}
        smoothness={3}
        position={[0, 0.52 + backrestHeight / 2, -0.19]}
        rotation={[-0.08, 0, 0]}
        castShadow
      >
        <meshStandardMaterial color={seatColor} roughness={0.74} metalness={0.1} />
      </RoundedBox>
      {/* Padded armrests */}
      {[-0.25, 0.25].map((ax, idx) => (
        <group key={idx} position={[ax, 0.56, 0.01]}>
          <mesh position={[0, -0.06, -0.02]}>
            <boxGeometry args={[0.03, 0.16, 0.035]} />
            <meshStandardMaterial color="#64748b" roughness={0.25} metalness={0.85} />
          </mesh>
          <RoundedBox args={[0.055, 0.032, 0.26]} radius={0.012} smoothness={2} position={[0, 0.03, 0.04]}>
            <meshStandardMaterial color="#111827" roughness={0.65} metalness={0.12} />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

/**
 * Realistic proportioned seated Operations Engineer (Zone 1: Intake).
 * Performs natural subtle breathing, multi-monitor gaze shifts, and keyboard typing kinematics.
 */
export function EmployeeAvatar({
  position,
  rotationY = 0,
  shirtColor = '#1e40af',
}: EmployeeAvatarProps) {
  const upperBodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const leftForearmRef = useRef<THREE.Group>(null);
  const rightForearmRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (upperBodyRef.current) {
      upperBodyRef.current.rotation.x = 0.06 + Math.sin(t * 1.6) * 0.015;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * 0.75) * 0.22;
      headRef.current.rotation.x = 0.06 + Math.sin(t * 1.5) * 0.025;
    }
    if (leftForearmRef.current && rightForearmRef.current) {
      leftForearmRef.current.rotation.x = -1.25 + Math.sin(t * 7.2) * 0.055;
      rightForearmRef.current.rotation.x = -1.25 + Math.cos(t * 7.8) * 0.055;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <ErgonomicTaskChair />

      {/* Pelvis & Seated Tailored Trousers */}
      <group position={[0, 0.52, 0.03]}>
        <RoundedBox args={[0.36, 0.14, 0.26]} radius={0.05} smoothness={3} castShadow>
          <meshStandardMaterial color="#1e293b" roughness={0.78} metalness={0.04} />
        </RoundedBox>
        {/* Left & Right Thighs + Calves + Leather Shoes */}
        {[-0.1, 0.1].map((lx, idx) => (
          <group key={idx} position={[lx, -0.02, 0.16]}>
            <mesh rotation={[Math.PI / 2 - 0.06, 0, 0]} castShadow>
              <capsuleGeometry args={[0.068, 0.24, 8, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.78} metalness={0.04} />
            </mesh>
            <mesh position={[0, -0.22, 0.18]} castShadow>
              <capsuleGeometry args={[0.054, 0.28, 8, 12]} />
              <meshStandardMaterial color="#1e293b" roughness={0.78} metalness={0.04} />
            </mesh>
            {/* Shoe */}
            <RoundedBox
              args={[0.09, 0.06, 0.2]}
              radius={0.02}
              smoothness={2}
              position={[0, -0.44, 0.22]}
              castShadow
            >
              <meshStandardMaterial color="#111827" roughness={0.42} metalness={0.18} />
            </RoundedBox>
          </group>
        ))}
      </group>

      {/* Articulated Upper Torso */}
      <group ref={upperBodyRef} position={[0, 0.58, 0.01]}>
        {/* Sculpted shirt torso */}
        <RoundedBox
          args={[0.36, 0.44, 0.2]}
          radius={0.065}
          smoothness={3}
          position={[0, 0.24, 0]}
          castShadow
        >
          <meshStandardMaterial color={shirtColor} roughness={0.72} metalness={0.05} />
        </RoundedBox>
        {/* Corporate collar & security ID lanyard */}
        <mesh position={[0, 0.44, 0.01]}>
          <cylinderGeometry args={[0.072, 0.088, 0.055, 14]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.65} />
        </mesh>
        <mesh position={[0.06, 0.22, 0.106]}>
          <boxGeometry args={[0.055, 0.082, 0.012]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
        </mesh>
        <mesh position={[0.06, 0.245, 0.114]}>
          <boxGeometry args={[0.045, 0.016, 0.005]} />
          <meshStandardMaterial color="#0ea5e9" roughness={0.35} />
        </mesh>

        {/* Neck & Sculpted Head */}
        <group ref={headRef} position={[0, 0.49, 0.01]}>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.058, 0.09, 12]} />
            <meshStandardMaterial color="#d8a888" roughness={0.58} metalness={0.02} />
          </mesh>
          {/* Cranium */}
          <mesh position={[0, 0.15, 0.01]} scale={[0.92, 1.06, 0.98]} castShadow>
            <sphereGeometry args={[0.115, 18, 18]} />
            <meshStandardMaterial color="#dfb090" roughness={0.56} metalness={0.02} />
          </mesh>
          {/* Natural sculpted hair cap */}
          <mesh position={[0, 0.185, -0.012]} scale={[0.96, 0.94, 1.02]} castShadow>
            <sphereGeometry args={[0.116, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.58]} />
            <meshStandardMaterial color="#1f1b18" roughness={0.85} metalness={0.04} />
          </mesh>
          {/* Ears */}
          {[-0.105, 0.105].map((ex, i) => (
            <mesh key={i} position={[ex, 0.145, 0]} scale={[0.45, 0.9, 0.6]}>
              <sphereGeometry args={[0.032, 10, 10]} />
              <meshStandardMaterial color="#d4a080" roughness={0.6} />
            </mesh>
          ))}
        </group>

        {/* Left Articulated Arm */}
        <group position={[-0.22, 0.39, 0.02]}>
          <mesh position={[0, -0.11, 0.05]} rotation={[0.42, 0, 0.08]} castShadow>
            <capsuleGeometry args={[0.046, 0.18, 8, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.72} />
          </mesh>
          <group ref={leftForearmRef} position={[-0.01, -0.21, 0.11]} rotation={[-1.25, 0.18, 0]}>
            <mesh position={[0, -0.1, 0]} castShadow>
              <capsuleGeometry args={[0.038, 0.16, 8, 10]} />
              <meshStandardMaterial color="#dfb090" roughness={0.58} />
            </mesh>
            <mesh position={[0, -0.21, 0]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshStandardMaterial color="#dfb090" roughness={0.58} />
            </mesh>
          </group>
        </group>

        {/* Right Articulated Arm */}
        <group position={[0.22, 0.39, 0.02]}>
          <mesh position={[0, -0.11, 0.05]} rotation={[0.42, 0, -0.08]} castShadow>
            <capsuleGeometry args={[0.046, 0.18, 8, 10]} />
            <meshStandardMaterial color={shirtColor} roughness={0.72} />
          </mesh>
          <group ref={rightForearmRef} position={[0.01, -0.21, 0.11]} rotation={[-1.25, -0.18, 0]}>
            <mesh position={[0, -0.1, 0]} castShadow>
              <capsuleGeometry args={[0.038, 0.16, 8, 10]} />
              <meshStandardMaterial color="#dfb090" roughness={0.58} />
            </mesh>
            <mesh position={[0, -0.21, 0]}>
              <sphereGeometry args={[0.036, 10, 10]} />
              <meshStandardMaterial color="#dfb090" roughness={0.58} />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}

/**
 * Realistic proportioned Executive Operations Manager (Zone 2 South).
 * Wears tailored dark charcoal suit blazer + dress shirt + tie.
 * Overwhelmed posture reviewing stacks in AS-IS vs calm supervisory posture in TO-BE.
 */
export function ManagerAvatar({
  position,
  rotationY = 0,
  overwhelmed,
}: ManagerAvatarProps) {
  const upperBodyRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (upperBodyRef.current) {
      upperBodyRef.current.rotation.x = overwhelmed
        ? 0.22 + Math.sin(t * 2.4) * 0.028
        : 0.02 + Math.sin(t * 1.1) * 0.012;
    }
    if (headRef.current) {
      headRef.current.rotation.y = overwhelmed
        ? Math.sin(t * 3.1) * 0.28
        : Math.sin(t * 0.65) * 0.12;
      headRef.current.rotation.x = overwhelmed ? 0.18 : 0.02;
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = overwhelmed
        ? -0.95 + Math.sin(t * 5.2) * 0.18
        : -0.78 + Math.sin(t * 1.2) * 0.03;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <ErgonomicTaskChair executive />

      {/* Seated Suit Trousers */}
      <group position={[0, 0.52, 0.03]}>
        <RoundedBox args={[0.38, 0.14, 0.27]} radius={0.05} smoothness={3} castShadow>
          <meshStandardMaterial color="#181f2c" roughness={0.76} metalness={0.06} />
        </RoundedBox>
        {[-0.105, 0.105].map((lx, idx) => (
          <group key={idx} position={[lx, -0.02, 0.16]}>
            <mesh rotation={[Math.PI / 2 - 0.05, 0, 0]} castShadow>
              <capsuleGeometry args={[0.07, 0.24, 8, 12]} />
              <meshStandardMaterial color="#181f2c" roughness={0.76} />
            </mesh>
            <mesh position={[0, -0.22, 0.18]} castShadow>
              <capsuleGeometry args={[0.056, 0.28, 8, 12]} />
              <meshStandardMaterial color="#181f2c" roughness={0.76} />
            </mesh>
            <RoundedBox
              args={[0.095, 0.062, 0.21]}
              radius={0.02}
              smoothness={2}
              position={[0, -0.44, 0.22]}
              castShadow
            >
              <meshStandardMaterial color="#0d1117" roughness={0.32} metalness={0.22} />
            </RoundedBox>
          </group>
        ))}
      </group>

      {/* Tailored Executive Jacket Torso */}
      <group ref={upperBodyRef} position={[0, 0.58, 0.01]}>
        <RoundedBox
          args={[0.4, 0.46, 0.22]}
          radius={0.065}
          smoothness={3}
          position={[0, 0.25, 0]}
          castShadow
        >
          <meshStandardMaterial color="#1f2937" roughness={0.68} metalness={0.08} />
        </RoundedBox>
        {/* Crisp white shirt V-front & executive tie */}
        <mesh position={[0, 0.34, 0.106]}>
          <boxGeometry args={[0.11, 0.22, 0.018]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.31, 0.118]}>
          <boxGeometry args={[0.036, 0.24, 0.012]} />
          <meshStandardMaterial
            color={overwhelmed ? '#b45309' : '#059669'}
            roughness={0.42}
            metalness={0.12}
          />
        </mesh>

        {/* Neck & Head */}
        <group ref={headRef} position={[0, 0.51, 0.01]}>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.052, 0.06, 0.09, 12]} />
            <meshStandardMaterial color="#d4a282" roughness={0.58} />
          </mesh>
          <mesh position={[0, 0.155, 0.01]} scale={[0.93, 1.06, 0.98]} castShadow>
            <sphereGeometry args={[0.118, 18, 18]} />
            <meshStandardMaterial color="#d9a888" roughness={0.56} />
          </mesh>
          {/* Distinguished silver-slate executive hair */}
          <mesh position={[0, 0.19, -0.012]} scale={[0.97, 0.92, 1.02]} castShadow>
            <sphereGeometry args={[0.118, 16, 16, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <meshStandardMaterial color="#475569" roughness={0.82} />
          </mesh>
          {/* Subtle glasses frames */}
          <mesh position={[0, 0.155, 0.11]}>
            <boxGeometry args={[0.15, 0.022, 0.015]} />
            <meshStandardMaterial color="#0f172a" roughness={0.25} metalness={0.85} />
          </mesh>
        </group>

        {/* Left Arm resting on desk */}
        <group position={[-0.24, 0.4, 0.02]}>
          <mesh position={[0, -0.11, 0.06]} rotation={[0.48, 0, 0.1]} castShadow>
            <capsuleGeometry args={[0.048, 0.19, 8, 10]} />
            <meshStandardMaterial color="#1f2937" roughness={0.68} />
          </mesh>
          <mesh position={[-0.01, -0.22, 0.2]} rotation={[Math.PI / 2, 0, -0.15]} castShadow>
            <capsuleGeometry args={[0.04, 0.16, 8, 10]} />
            <meshStandardMaterial color="#1f2937" roughness={0.68} />
          </mesh>
          <mesh position={[0.01, -0.22, 0.3]}>
            <sphereGeometry args={[0.038, 10, 10]} />
            <meshStandardMaterial color="#d9a888" roughness={0.56} />
          </mesh>
        </group>

        {/* Right Arm (signing/reviewing in AS-IS vs relaxed in TO-BE) */}
        <group ref={rightArmRef} position={[0.24, 0.4, 0.02]} rotation={[-0.85, 0, 0]}>
          <mesh position={[0, -0.14, 0]} castShadow>
            <capsuleGeometry args={[0.048, 0.24, 8, 10]} />
            <meshStandardMaterial color="#1f2937" roughness={0.68} />
          </mesh>
          <mesh position={[0, -0.29, 0.02]}>
            <sphereGeometry args={[0.038, 10, 10]} />
            <meshStandardMaterial color="#d9a888" roughness={0.56} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/**
 * Realistic proportioned standing Industrial Logistics Specialist (Zone 3).
 * Wears high-visibility safety vest with reflective bands, industrial helmet with visor,
 * work trousers, steel-toe boots, and operates a rugged RF barcode tablet.
 */
export function LogisticsAvatar({
  position,
  rotationY = 0,
  isFastMode,
}: LogisticsAvatarProps) {
  const torsoRef = useRef<THREE.Group>(null);
  const headRef = useRef<THREE.Group>(null);
  const scannerArmRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const rate = isFastMode ? 2.4 : 1.05;
    if (torsoRef.current) {
      torsoRef.current.rotation.y = Math.sin(t * rate * 0.7) * 0.14;
      torsoRef.current.position.y = 0.88 + Math.sin(t * rate * 1.4) * 0.008;
    }
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(t * rate * 0.85) * 0.22;
      headRef.current.rotation.x = 0.12;
    }
    if (scannerArmRef.current) {
      scannerArmRef.current.rotation.x = -0.95 + Math.sin(t * rate * 1.8) * 0.12;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Standing Legs & Industrial Safety Boots (grounded cleanly at y = 0) */}
      {[-0.1, 0.1].map((lx, idx) => (
        <group key={idx} position={[lx, 0, 0]}>
          {/* Steel-toe boot */}
          <RoundedBox
            args={[0.105, 0.085, 0.22]}
            radius={0.022}
            smoothness={2}
            position={[0, 0.044, 0.035]}
            castShadow
          >
            <meshStandardMaterial color="#1c1917" roughness={0.62} metalness={0.18} />
          </RoundedBox>
          {/* Calf & Thigh */}
          <mesh position={[0, 0.44, 0]} castShadow>
            <capsuleGeometry args={[0.064, 0.66, 8, 12]} />
            <meshStandardMaterial color="#1e293b" roughness={0.82} metalness={0.05} />
          </mesh>
        </group>
      ))}

      {/* Upper Body & High-Vis Safety Vest */}
      <group ref={torsoRef} position={[0, 0.88, 0]}>
        {/* Dark work polo underneath */}
        <RoundedBox
          args={[0.38, 0.48, 0.22]}
          radius={0.065}
          smoothness={3}
          position={[0, 0.24, 0]}
          castShadow
        >
          <meshStandardMaterial color="#0f172a" roughness={0.78} />
        </RoundedBox>
        {/* High-Visibility Safety Vest overlay */}
        <RoundedBox
          args={[0.395, 0.42, 0.232]}
          radius={0.06}
          smoothness={3}
          position={[0, 0.23, 0]}
          castShadow
        >
          <meshStandardMaterial
            color={isFastMode ? '#10b981' : '#ea580c'}
            roughness={0.62}
            metalness={0.06}
          />
        </RoundedBox>
        {/* Dual silver reflective safety stripes */}
        {[0.14, 0.26].map((sy, idx) => (
          <mesh key={idx} position={[0, sy, 0]}>
            <boxGeometry args={[0.405, 0.034, 0.242]} />
            <meshStandardMaterial
              color="#e2e8f0"
              roughness={0.22}
              metalness={0.78}
              emissive="#cbd5e1"
              emissiveIntensity={0.22}
            />
          </mesh>
        ))}

        {/* Neck, Head & Industrial Hard Hat */}
        <group ref={headRef} position={[0, 0.52, 0.01]}>
          <mesh position={[0, 0.02, 0]} castShadow>
            <cylinderGeometry args={[0.05, 0.058, 0.08, 12]} />
            <meshStandardMaterial color="#d4a07e" roughness={0.58} />
          </mesh>
          <mesh position={[0, 0.145, 0.01]} scale={[0.92, 1.05, 0.96]} castShadow>
            <sphereGeometry args={[0.114, 18, 18]} />
            <meshStandardMaterial color="#d8a584" roughness={0.58} />
          </mesh>
          {/* Hard hat shell with clearcoat finish */}
          <mesh position={[0, 0.195, 0]} castShadow>
            <sphereGeometry args={[0.132, 18, 14, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
            <meshPhysicalMaterial
              color="#f8fafc"
              roughness={0.22}
              metalness={0.08}
              clearcoat={0.85}
              clearcoatRoughness={0.18}
            />
          </mesh>
          {/* Hard hat front brim */}
          <mesh position={[0, 0.19, 0.085]} rotation={[0.14, 0, 0]} castShadow>
            <boxGeometry args={[0.18, 0.018, 0.11]} />
            <meshPhysicalMaterial color="#f8fafc" roughness={0.24} clearcoat={0.85} />
          </mesh>
        </group>

        {/* Left Supporting Arm */}
        <group position={[-0.23, 0.4, 0.02]} rotation={[-0.45, 0, 0.1]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <capsuleGeometry args={[0.048, 0.28, 8, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.78} />
          </mesh>
          <mesh position={[0, -0.32, 0.01]}>
            <sphereGeometry args={[0.038, 10, 10]} />
            <meshStandardMaterial color="#d8a584" roughness={0.58} />
          </mesh>
        </group>

        {/* Right Arm Holding Industrial Rugged RF Scanner Tablet */}
        <group ref={scannerArmRef} position={[0.23, 0.4, 0.02]} rotation={[-0.95, -0.15, 0]}>
          <mesh position={[0, -0.16, 0]} castShadow>
            <capsuleGeometry args={[0.048, 0.28, 8, 10]} />
            <meshStandardMaterial color="#0f172a" roughness={0.78} />
          </mesh>
          {/* Rugged Industrial Tablet */}
          <group position={[-0.04, -0.34, 0.06]} rotation={[0.55, 0, 0]}>
            <RoundedBox args={[0.16, 0.22, 0.026]} radius={0.012} smoothness={2} castShadow>
              <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.55} />
            </RoundedBox>
            <mesh position={[0, 0, 0.015]}>
              <planeGeometry args={[0.125, 0.18]} />
              <meshStandardMaterial
                color={isFastMode ? '#34d399' : '#38bdf8'}
                emissive={isFastMode ? '#10b981' : '#0ea5e9'}
                emissiveIntensity={1.15}
              />
            </mesh>
          </group>
        </group>
      </group>
    </group>
  );
}
