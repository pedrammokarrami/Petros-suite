import { useEffect, useMemo, useRef, useState } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import {
  ContactShadows,
  OrbitControls,
  OrthographicCamera,
} from '@react-three/drei';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { ZoneIntake } from './ZoneIntake';
import { ZoneApprovalHub } from './ZoneApprovalHub';
import { ZoneLogistics } from './ZoneLogistics';
import { DataConduits } from './DataConduits';
import { TaskPackages } from './TaskPackages';
import {
  createContactShadowTexture,
  createFacilitySubfloorTexture,
} from '../../utils/webgl';
import { CAMERA_PRESETS } from '../../platform/data';
import { UI_TRANSLATIONS } from '../../i18n/translations';
import type { SimHudSnapshot, SimMode, SimState } from '../../simulation/types';
import type { CustomZoneLabels, ZoneFocusId } from '../../platform/types';
import type { Locale } from '../../i18n/types';

interface ProcessSceneProps {
  mode: SimMode;
  locale: Locale;
  simRef: React.MutableRefObject<SimState>;
  isSoftwareGl: boolean;
  focusedZone: ZoneFocusId;
  focusNonce: number;
  customLabels: CustomZoneLabels | null;
  onHudUpdate: (snapshot: SimHudSnapshot) => void;
  onSelectStation: (station: Exclude<ZoneFocusId, 'overview'>) => void;
}

type BadgeKey = 'intake' | 'approval' | 'bottleneck' | 'ai_core' | 'logistics';

const BADGE_ANCHORS: Record<BadgeKey, [number, number, number]> = {
  intake: [-6.55, 2.35, -0.75],
  approval: [1.35, 2.6, 0.55],
  bottleneck: [-1.45, 0.72, 2.35],
  ai_core: [0.0, 2.75, -1.65],
  logistics: [6.55, 2.85, -0.55],
};

const _targetVec = new THREE.Vector3();
const _desiredCamPos = new THREE.Vector3();
const _projVec = new THREE.Vector3();
const ISO_OFFSET = new THREE.Vector3(15, 15, 15);

/**
 * Software-WebGL frame pacer: waits for the CPU WebGL draw fence to finish
 * and yields 85ms before requesting the next frame.
 */
function SoftwareGlPacer({ enabled }: { enabled: boolean }) {
  const { gl, invalidate } = useThree();

  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;
    let timerId = 0;

    const scheduleNext = () => {
      if (cancelled) return;
      const ctx = gl.getContext() as WebGL2RenderingContext;
      if (ctx && typeof ctx.fenceSync === 'function') {
        const sync = ctx.fenceSync(ctx.SYNC_GPU_COMMANDS_COMPLETE, 0);
        ctx.flush();
        const poll = () => {
          if (cancelled) {
            if (sync) ctx.deleteSync(sync);
            return;
          }
          const status = sync
            ? ctx.getSyncParameter(sync, ctx.SYNC_STATUS)
            : ctx.SIGNALED;
          if (status === ctx.UNSIGNALED) {
            timerId = window.setTimeout(poll, 8);
          } else {
            if (sync) ctx.deleteSync(sync);
            timerId = window.setTimeout(() => {
              if (!cancelled) {
                invalidate();
                scheduleNext();
              }
            }, 85);
          }
        };
        timerId = window.setTimeout(poll, 8);
      } else {
        timerId = window.setTimeout(() => {
          if (!cancelled) {
            invalidate();
            scheduleNext();
          }
        }, 95);
      }
    };

    invalidate();
    scheduleNext();

    return () => {
      cancelled = true;
      window.clearTimeout(timerId);
    };
  }, [enabled, gl, invalidate]);

  return null;
}

/**
 * Procedural zero-dependency studio IBL environment map via RoomEnvironment + PMREMGenerator.
 * Balanced intensity gives rich metallic reflections without washing out dark concrete floors.
 */
function StudioEnvironment() {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const roomEnv = new RoomEnvironment();
    const envTarget = pmrem.fromScene(roomEnv, 0.04);
    scene.environment = envTarget.texture;
    scene.environmentIntensity = 0.42;
    roomEnv.dispose();
    pmrem.dispose();

    return () => {
      scene.environment = null;
      envTarget.dispose();
    };
  }, [gl, scene]);

  return null;
}

/**
 * Projects 3D station world coordinates onto DOM overlay badge refs every frame.
 * Completely immune to React 19 + drei <Html> unmount race errors and clamps
 * cleanly inside mobile viewports so badges never clip off-screen.
 */
function BadgeProjector({
  badgeRefs,
}: {
  badgeRefs: React.MutableRefObject<Partial<Record<BadgeKey, HTMLDivElement | null>>>;
}) {
  const { camera, size } = useThree();

  useFrame(() => {
    const keys = Object.keys(BADGE_ANCHORS) as BadgeKey[];
    const w = size.width;
    const h = size.height;

    for (const key of keys) {
      const el = badgeRefs.current[key];
      if (!el) continue;

      const [wx, wy, wz] = BADGE_ANCHORS[key];
      _projVec.set(wx, wy, wz).project(camera);

      const rawX = (_projVec.x * 0.5 + 0.5) * w;
      const rawY = (-_projVec.y * 0.5 + 0.5) * h;

      // Clamp gracefully inside viewport edges so narrow mobile screens never clip text
      const halfW = Math.max(46, el.offsetWidth / 2);
      const clampedX = Math.max(halfW + 8, Math.min(w - halfW - 8, rawX));
      const clampedY = Math.max(76, Math.min(h - 92, rawY));

      el.style.transform = `translate3d(${clampedX.toFixed(1)}px, ${clampedY.toFixed(1)}px, 0) translate(-50%, -50%)`;
      el.style.opacity = '1';
    }
  });

  return null;
}

/**
 * Smoothly glides the orthographic camera & OrbitControls target to any focused zone
 * using frame-rate-independent exponential damping, yielding immediately on manual orbit.
 */
function CameraRigController({
  focusedZone,
  focusNonce,
  isSoftwareGl,
}: {
  focusedZone: ZoneFocusId;
  focusNonce: number;
  isSoftwareGl: boolean;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera, size } = useThree();
  const isAnimatingRef = useRef(true);

  useEffect(() => {
    isAnimatingRef.current = true;
  }, [focusedZone, focusNonce, size.width]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const cancelTransition = () => {
      isAnimatingRef.current = false;
    };
    controls.addEventListener('start', cancelTransition);
    return () => {
      controls.removeEventListener('start', cancelTransition);
    };
  }, []);

  useFrame((_, delta) => {
    const controls = controlsRef.current;
    if (!controls || !isAnimatingRef.current) return;

    const preset = CAMERA_PRESETS[focusedZone];
    const isMobile = size.width < 768;
    const isMedium = size.width >= 768 && size.width < 1180;
    const targetZoom = isMobile
      ? preset.zoomMobile
      : isMedium
        ? Math.round(preset.zoomDesktop * 0.82)
        : preset.zoomDesktop;

    _targetVec.set(preset.target[0], preset.target[1], preset.target[2]);
    _desiredCamPos.copy(_targetVec).add(ISO_OFFSET);

    const lambda = isSoftwareGl ? 10 : 6.5;
    controls.target.x = THREE.MathUtils.damp(
      controls.target.x,
      _targetVec.x,
      lambda,
      delta
    );
    controls.target.y = THREE.MathUtils.damp(
      controls.target.y,
      _targetVec.y,
      lambda,
      delta
    );
    controls.target.z = THREE.MathUtils.damp(
      controls.target.z,
      _targetVec.z,
      lambda,
      delta
    );

    camera.position.x = THREE.MathUtils.damp(
      camera.position.x,
      _desiredCamPos.x,
      lambda,
      delta
    );
    camera.position.y = THREE.MathUtils.damp(
      camera.position.y,
      _desiredCamPos.y,
      lambda,
      delta
    );
    camera.position.z = THREE.MathUtils.damp(
      camera.position.z,
      _desiredCamPos.z,
      lambda,
      delta
    );

    if (camera instanceof THREE.OrthographicCamera) {
      const nextZoom = THREE.MathUtils.damp(
        camera.zoom,
        targetZoom,
        lambda,
        delta
      );
      if (Math.abs(nextZoom - camera.zoom) > 0.01) {
        camera.zoom = nextZoom;
        camera.updateProjectionMatrix();
      }
    }

    controls.update();

    const dist = controls.target.distanceTo(_targetVec);
    const zoomDiff =
      camera instanceof THREE.OrthographicCamera
        ? Math.abs(camera.zoom - targetZoom)
        : 0;
    if (dist < 0.02 && zoomDiff < 0.1) {
      controls.target.copy(_targetVec);
      camera.position.copy(_desiredCamPos);
      if (camera instanceof THREE.OrthographicCamera) {
        camera.zoom = targetZoom;
        camera.updateProjectionMatrix();
      }
      controls.update();
      isAnimatingRef.current = false;
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      target={[0, 0.15, 0]}
      enableDamping={!isSoftwareGl}
      dampingFactor={0.07}
      minPolarAngle={Math.PI / 6}
      maxPolarAngle={Math.PI / 2.25}
      minZoom={20}
      maxZoom={115}
      enablePan={true}
      panSpeed={0.65}
    />
  );
}

/**
 * Brushed-concrete industrial facility subfloor with grounding contact shadow pools beneath each island.
 */
function StudioGroundPlane() {
  const shadowTex = useMemo(() => createContactShadowTexture(), []);
  const floorTex = useMemo(() => createFacilitySubfloorTexture(), []);

  useEffect(() => {
    return () => {
      shadowTex.dispose();
      floorTex.dispose();
    };
  }, [shadowTex, floorTex]);

  return (
    <group position={[0, -0.78, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.04, 0]} receiveShadow>
        <planeGeometry args={[96, 96]} />
        <meshStandardMaterial
          map={floorTex}
          color="#ffffff"
          roughness={0.88}
          metalness={0.12}
        />
      </mesh>

      {[
        { pos: [-6.0, 0, 0] as [number, number, number], scale: [6.6, 6.6] as [number, number] },
        { pos: [0.0, 0, 0] as [number, number, number], scale: [8.0, 8.2] as [number, number] },
        { pos: [6.0, 0, 0] as [number, number, number], scale: [7.0, 7.2] as [number, number] },
      ].map((pool, i) => (
        <mesh key={i} position={pool.pos} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={pool.scale} />
          <meshBasicMaterial
            map={shadowTex}
            transparent
            opacity={0.84}
            depthWrite={false}
          />
        </mesh>
      ))}
    </group>
  );
}

export function ProcessScene({
  mode,
  locale,
  simRef,
  isSoftwareGl,
  focusedZone,
  focusNonce,
  customLabels,
  onHudUpdate,
  onSelectStation,
}: ProcessSceneProps) {
  const [contextLost, setContextLost] = useState(false);
  const badgeRefs = useRef<Partial<Record<BadgeKey, HTMLDivElement | null>>>({});
  const t = UI_TRANSLATIONS[locale];
  const isToBe = mode === 'TO_BE';
  const isRtl = locale === 'fa';

  if (contextLost) {
    return (
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className="flex h-full w-full flex-col items-center justify-center bg-[#090d16] p-6 text-center"
      >
        <p className="text-base font-semibold text-slate-100">
          {t.webglLost.message}
        </p>
        <button
          type="button"
          onClick={() => setContextLost(false)}
          className="mt-4 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition-all hover:bg-emerald-400 active:scale-95"
        >
          {t.webglLost.reloadButton}
        </button>
      </div>
    );
  }

  return (
    <div data-testid="scene-viewport" className="relative h-full w-full bg-[#090d16]">
      <Canvas
        shadows={!isSoftwareGl}
        dpr={isSoftwareGl ? 1 : [1, 2]}
        frameloop={isSoftwareGl ? 'demand' : 'always'}
        gl={{
          antialias: !isSoftwareGl,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
        }}
        onCreated={({ gl, camera }) => {
          camera.lookAt(0, 0, 0);
          const canvas = gl.domElement;
          const handleLost = (e: Event) => {
            e.preventDefault();
            setContextLost(true);
          };
          const handleRestored = () => {
            setContextLost(false);
          };
          canvas.addEventListener('webglcontextlost', handleLost, false);
          canvas.addEventListener('webglcontextrestored', handleRestored, false);
        }}
      >
        <color attach="background" args={['#090d16']} />
        <fog attach="fog" args={['#090d16', 28, 60]} />

        <OrthographicCamera
          makeDefault
          position={[15, 15, 15]}
          zoom={48}
          near={0.1}
          far={120}
        />

        <CameraRigController
          focusedZone={focusedZone}
          focusNonce={focusNonce}
          isSoftwareGl={isSoftwareGl}
        />

        <StudioEnvironment />

        {/* Photorealistic 3-Point Industrial Studio Lighting Rig */}
        <hemisphereLight args={['#9bb6d6', '#0b1220', 0.55]} />
        <directionalLight
          position={[12, 17, 11]}
          intensity={1.9}
          color="#fff1db"
          castShadow={!isSoftwareGl}
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-14}
          shadow-camera-right={14}
          shadow-camera-top={11}
          shadow-camera-bottom={-11}
          shadow-camera-near={2}
          shadow-camera-far={44}
          shadow-bias={-0.0004}
          shadow-normalBias={0.02}
        />
        <directionalLight position={[-11, 10, -11]} intensity={0.85} color="#7dd3fc" />
        <directionalLight position={[0, 4, 14]} intensity={0.35} color="#cbd5e1" />

        <StudioGroundPlane />
        {!isSoftwareGl && (
          <ContactShadows
            position={[0, -0.76, 0]}
            opacity={0.55}
            scale={30}
            blur={2.0}
            far={4.5}
            resolution={1024}
            color="#020617"
          />
        )}

        {/* Three Photorealistic Interactive Enterprise Zones */}
        <ZoneIntake
          mode={mode}
          isFocused={focusedZone === 'intake'}
          onSelectStation={() => onSelectStation('intake')}
        />
        <ZoneApprovalHub
          mode={mode}
          simRef={simRef}
          focusedZone={focusedZone}
          onSelectStation={onSelectStation}
        />
        <ZoneLogistics
          mode={mode}
          simRef={simRef}
          isFocused={focusedZone === 'logistics'}
          onSelectStation={() => onSelectStation('logistics')}
        />

        <DataConduits mode={mode} />

        <TaskPackages simRef={simRef} onHudUpdate={onHudUpdate} />

        <BadgeProjector badgeRefs={badgeRefs} />
        <SoftwareGlPacer enabled={isSoftwareGl} />
      </Canvas>

      {/* ================================================================= */}
      {/* ZERO-ERROR 3D-PROJECTED SPATIAL GLASS STATION BADGES              */}
      {/* ================================================================= */}
      <div
        aria-label="3D Station Labels"
        className="pointer-events-none absolute inset-0 z-10 overflow-hidden"
      >
        {/* Zone 1: Intake */}
        <div
          ref={(el) => {
            badgeRefs.current.intake = el;
          }}
          style={{ opacity: 0 }}
          className="pointer-events-auto absolute top-0 left-0 will-change-transform"
        >
          <button
            type="button"
            data-testid="badge-3d-intake"
            onClick={() => onSelectStation('intake')}
            dir={isRtl ? 'rtl' : 'ltr'}
            className="cursor-pointer select-none whitespace-nowrap rounded-full bg-slate-950/84 px-3 py-1 text-center ring-1 ring-inset ring-sky-400/50 shadow-[0_12px_28px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:scale-105 active:scale-95"
          >
            <span className="text-[11px] font-semibold tracking-tight text-sky-200">
              {customLabels?.intakeLabel ?? t.badges3d.intake}
            </span>
          </button>
        </div>

        {/* Zone 2: Manual Review & Bottleneck (AS-IS) vs AI Auto-Approval (TO-BE) */}
        {!isToBe ? (
          <>
            <div
              ref={(el) => {
                badgeRefs.current.approval = el;
              }}
              style={{ opacity: 0 }}
              className="pointer-events-auto absolute top-0 left-0 will-change-transform"
            >
              <button
                type="button"
                data-testid="badge-3d-approval"
                onClick={() => onSelectStation('approval')}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="cursor-pointer select-none whitespace-nowrap rounded-full bg-slate-950/86 px-3 py-1 text-center ring-1 ring-inset ring-amber-400/55 shadow-[0_12px_28px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <span className="text-[11px] font-semibold text-amber-200">
                  {customLabels?.approvalAsIsLabel ?? t.badges3d.approvalAsIs}
                </span>
              </button>
            </div>

            <div
              ref={(el) => {
                badgeRefs.current.bottleneck = el;
              }}
              style={{ opacity: 0 }}
              className="pointer-events-auto absolute top-0 left-0 will-change-transform"
            >
              <button
                type="button"
                data-testid="badge-3d-bottleneck"
                onClick={() => onSelectStation('approval')}
                dir={isRtl ? 'rtl' : 'ltr'}
                className="cursor-pointer select-none whitespace-nowrap rounded-full bg-rose-950/90 px-3 py-1 text-center ring-1 ring-inset ring-rose-400/60 shadow-[0_12px_28px_rgba(0,0,0,0.58)] transition-transform duration-200 hover:scale-105 active:scale-95"
              >
                <span className="text-[10.5px] font-semibold text-rose-100">
                  {t.badges3d.bottleneck}
                </span>
              </button>
            </div>
          </>
        ) : (
          <div
            ref={(el) => {
              badgeRefs.current.ai_core = el;
            }}
            style={{ opacity: 0 }}
            className="pointer-events-auto absolute top-0 left-0 will-change-transform"
          >
            <button
              type="button"
              data-testid="badge-3d-ai-core"
              onClick={() => onSelectStation('ai_core')}
              dir={isRtl ? 'rtl' : 'ltr'}
              className="cursor-pointer select-none whitespace-nowrap rounded-full bg-slate-950/86 px-3.5 py-1 text-center ring-1 ring-inset ring-emerald-400/55 shadow-[0_12px_28px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:scale-105 active:scale-95"
            >
              <span className="text-[11px] font-semibold text-emerald-200">
                {customLabels?.approvalToBeLabel ?? t.badges3d.approvalToBe}
              </span>
            </button>
          </div>
        )}

        {/* Zone 3: Logistics */}
        <div
          ref={(el) => {
            badgeRefs.current.logistics = el;
          }}
          style={{ opacity: 0 }}
          className="pointer-events-auto absolute top-0 left-0 will-change-transform"
        >
          <button
            type="button"
            data-testid="badge-3d-logistics"
            onClick={() => onSelectStation('logistics')}
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`cursor-pointer select-none whitespace-nowrap rounded-full bg-slate-950/86 px-3 py-1 text-center ring-1 ring-inset shadow-[0_12px_28px_rgba(0,0,0,0.55)] transition-transform duration-200 hover:scale-105 active:scale-95 ${
              isToBe ? 'ring-emerald-400/55' : 'ring-slate-400/45'
            }`}
          >
            <span
              className={`text-[11px] font-semibold ${
                isToBe ? 'text-emerald-200' : 'text-slate-100'
              }`}
            >
              {isToBe
                ? (customLabels?.logisticsLabel ?? t.badges3d.logisticsToBe)
                : t.badges3d.logisticsAsIs}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}
