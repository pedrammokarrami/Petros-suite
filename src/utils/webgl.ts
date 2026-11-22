import * as THREE from 'three';

let cachedSoftwareGl: boolean | null = null;

/**
 * Probes WebGL2 renderer string once to detect software rasterizers (SwiftShader, llvmpipe, WARP).
 * Used strictly for rendering cost tuning (pixel ratio, shadow map, frame pacing), never scene content.
 */
export function detectSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  if (typeof document === 'undefined') {
    cachedSoftwareGl = false;
    return false;
  }
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const rendererStr = String(gl.getParameter(param) ?? '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(rendererStr);
    return cachedSoftwareGl;
  } catch {
    cachedSoftwareGl = true;
    return true;
  }
}

function pseudoRand(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

/**
 * Generates PBR albedo + bump + roughness maps for a photorealistic brushed concrete / industrial epoxy deck.
 */
export function createEpoxyFloorTextures(accentHex: string): {
  map: THREE.CanvasTexture;
  bumpMap: THREE.CanvasTexture;
  roughnessMap: THREE.CanvasTexture;
} {
  const size = 512;

  // 1. Albedo Canvas
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  const baseGrad = ctx.createLinearGradient(0, 0, size, size);
  baseGrad.addColorStop(0, '#161e2c');
  baseGrad.addColorStop(0.5, '#121926');
  baseGrad.addColorStop(1, '#0e1420');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, size, size);

  // Micro-concrete aggregate speckle & brushed epoxy troweling
  for (let i = 0; i < 2400; i++) {
    const x = pseudoRand(i * 1.17) * size;
    const y = pseudoRand(i * 2.31) * size;
    const w = 1 + pseudoRand(i * 3.13) * 4;
    const h = 1 + pseudoRand(i * 4.07) * 1.5;
    const bright = pseudoRand(i * 5.21) > 0.5;
    ctx.fillStyle = bright ? 'rgba(203, 213, 225, 0.032)' : 'rgba(2, 6, 23, 0.08)';
    ctx.fillRect(x, y, w, h);
  }

  // Architectural poured-concrete expansion joints (4x4 slabs)
  const step = 128;
  ctx.strokeStyle = 'rgba(2, 6, 14, 0.72)';
  ctx.lineWidth = 2;
  for (let p = step; p < size; p += step) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();

    // Subtle beveled highlight next to joint
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.09)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(p + 1.5, 0);
    ctx.lineTo(p + 1.5, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p + 1.5);
    ctx.lineTo(size, p + 1.5);
    ctx.stroke();
    ctx.strokeStyle = 'rgba(2, 6, 14, 0.72)';
    ctx.lineWidth = 2;
  }

  // Subtle perimeter safety inlay & technical registration corners
  ctx.strokeStyle = accentHex;
  ctx.globalAlpha = 0.48;
  ctx.lineWidth = 3;
  ctx.strokeRect(14, 14, size - 28, size - 28);
  ctx.globalAlpha = 0.16;
  ctx.lineWidth = 1;
  ctx.strokeRect(24, 24, size - 48, size - 48);
  ctx.globalAlpha = 1;

  // Corner brushed-steel anchor plates
  ctx.fillStyle = '#2a3548';
  const anchors = [
    [10, 10],
    [size - 28, 10],
    [10, size - 28],
    [size - 28, size - 28],
  ];
  for (const [ax, ay] of anchors) {
    ctx.fillRect(ax, ay, 18, 18);
    ctx.fillStyle = accentHex;
    ctx.fillRect(ax + 6, ay + 6, 6, 6);
    ctx.fillStyle = '#2a3548';
  }

  // 2. Bump Map Canvas (micro grain + recessed expansion seams)
  const bumpCanvas = document.createElement('canvas');
  bumpCanvas.width = size;
  bumpCanvas.height = size;
  const bCtx = bumpCanvas.getContext('2d')!;
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, size, size);

  for (let i = 0; i < 2000; i++) {
    const x = pseudoRand(i * 1.17) * size;
    const y = pseudoRand(i * 2.31) * size;
    const lum = Math.floor(110 + pseudoRand(i * 7.3) * 36);
    bCtx.fillStyle = `rgb(${lum},${lum},${lum})`;
    bCtx.fillRect(x, y, 2, 2);
  }
  bCtx.strokeStyle = '#303030';
  bCtx.lineWidth = 3;
  for (let p = step; p < size; p += step) {
    bCtx.beginPath();
    bCtx.moveTo(p, 0);
    bCtx.lineTo(p, size);
    bCtx.stroke();
    bCtx.beginPath();
    bCtx.moveTo(0, p);
    bCtx.lineTo(size, p);
    bCtx.stroke();
  }

  // 3. Roughness Map Canvas (satin-matte sealed concrete with rougher expansion joints)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = size;
  roughCanvas.height = size;
  const rCtx = roughCanvas.getContext('2d')!;
  rCtx.fillStyle = '#bcbcbc';
  rCtx.fillRect(0, 0, size, size);
  for (let i = 0; i < 120; i++) {
    const x = pseudoRand(i * 9.1) * size;
    const y = pseudoRand(i * 6.3) * size;
    const rad = 18 + pseudoRand(i * 3.7) * 44;
    const g = rCtx.createRadialGradient(x, y, 2, x, y, rad);
    const val = Math.floor(168 + pseudoRand(i * 2.9) * 46);
    g.addColorStop(0, `rgba(${val},${val},${val},0.35)`);
    g.addColorStop(1, 'rgba(188,188,188,0)');
    rCtx.fillStyle = g;
    rCtx.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  rCtx.strokeStyle = '#dcdcdc';
  rCtx.lineWidth = 3;
  for (let p = step; p < size; p += step) {
    rCtx.beginPath();
    rCtx.moveTo(p, 0);
    rCtx.lineTo(p, size);
    rCtx.stroke();
    rCtx.beginPath();
    rCtx.moveTo(0, p);
    rCtx.lineTo(size, p);
    rCtx.stroke();
  }

  const map = new THREE.CanvasTexture(albedoCanvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.anisotropy = 8;

  const bumpMap = new THREE.CanvasTexture(bumpCanvas);
  bumpMap.anisotropy = 4;

  const roughnessMap = new THREE.CanvasTexture(roughCanvas);
  roughnessMap.anisotropy = 4;

  return { map, bumpMap, roughnessMap };
}

/**
 * Generates a fine horizontal brushed anodized aluminum / titanium bump map.
 */
export function createBrushedMetalBumpMap(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, size, size);

  for (let y = 0; y < size; y++) {
    const lum = Math.floor(114 + pseudoRand(y * 13.7) * 28);
    ctx.fillStyle = `rgb(${lum},${lum},${lum})`;
    ctx.fillRect(0, y, size, 1);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2, 2);
  return tex;
}

/**
 * Generates a dark architectural brushed-concrete subfloor texture for the large facility floor.
 */
export function createFacilitySubfloorTexture(): THREE.CanvasTexture {
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#0c111b';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 1800; i++) {
    const x = pseudoRand(i * 1.9) * size;
    const y = pseudoRand(i * 3.1) * size;
    ctx.fillStyle =
      pseudoRand(i * 4.3) > 0.5
        ? 'rgba(148, 163, 184, 0.025)'
        : 'rgba(2, 6, 23, 0.06)';
    ctx.fillRect(x, y, 3, 2);
  }

  ctx.strokeStyle = 'rgba(30, 41, 59, 0.36)';
  ctx.lineWidth = 1.5;
  const step = 128;
  for (let p = 0; p <= size; p += step) {
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, size);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(size, p);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(10, 10);
  tex.anisotropy = 4;
  return tex;
}

/**
 * Generates a subtle radial contact shadow disc texture for grounding props and platforms.
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createRadialGradient(
    size / 2,
    size / 2,
    size * 0.08,
    size / 2,
    size / 2,
    size * 0.48
  );
  grad.addColorStop(0, 'rgba(2, 6, 14, 0.78)');
  grad.addColorStop(0.55, 'rgba(2, 6, 14, 0.36)');
  grad.addColorStop(1, 'rgba(2, 6, 14, 0.0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a high-DPI industrial refinery SCADA / ERP control dashboard screen texture.
 */
export function createMonitorScreenTexture(
  variant: 'intake' | 'manager_alert' | 'manager_idle'
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 320;
  const ctx = canvas.getContext('2d')!;

  // Dark glass interface background
  ctx.fillStyle = '#070c17';
  ctx.fillRect(0, 0, 512, 320);

  // Subtle top bar
  ctx.fillStyle = '#0f172a';
  ctx.fillRect(0, 0, 512, 38);

  const primary =
    variant === 'intake'
      ? '#38bdf8'
      : variant === 'manager_alert'
        ? '#f59e0b'
        : '#10b981';

  // Status indicators in header
  ctx.fillStyle = primary;
  ctx.fillRect(20, 14, 88, 10);
  ctx.fillStyle = '#334155';
  ctx.fillRect(120, 14, 62, 10);
  ctx.fillStyle = variant === 'manager_alert' ? '#ef4444' : '#10b981';
  ctx.fillRect(424, 12, 68, 14);

  // Left KPI Telemetry Panel
  ctx.fillStyle = '#111b2e';
  ctx.fillRect(16, 52, 178, 126);
  ctx.strokeStyle = 'rgba(148,163,184,0.18)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(16, 52, 178, 126);

  // Sparkline wave inside left panel
  ctx.strokeStyle = primary;
  ctx.lineWidth = 3;
  ctx.beginPath();
  for (let x = 0; x <= 150; x += 15) {
    const px = 30 + x;
    const py =
      128 -
      Math.sin(x * 0.055 + (variant === 'manager_alert' ? 1.4 : 0.2)) * 28 -
      (variant === 'manager_idle' ? x * 0.16 : 0);
    if (x === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  ctx.stroke();

  // Right Task Queue Table
  ctx.fillStyle = '#111b2e';
  ctx.fillRect(208, 52, 288, 250);
  ctx.strokeStyle = 'rgba(148,163,184,0.18)';
  ctx.strokeRect(208, 52, 288, 250);

  for (let i = 0; i < 6; i++) {
    const y = 66 + i * 38;
    ctx.fillStyle = '#17233a';
    ctx.fillRect(222, y, 260, 28);

    ctx.fillStyle = i === 0 ? primary : 'rgba(203, 213, 225, 0.45)';
    ctx.fillRect(234, y + 9, 130 + ((i * 27) % 68), 9);

    ctx.fillStyle =
      variant === 'manager_alert' && i < 4
        ? '#ef4444'
        : variant === 'manager_idle'
          ? '#10b981'
          : primary;
    ctx.fillRect(436, y + 9, 34, 9);
  }

  // Bottom-left bar chart
  ctx.fillStyle = '#111b2e';
  ctx.fillRect(16, 190, 178, 112);
  ctx.strokeRect(16, 190, 178, 112);
  const heights =
    variant === 'manager_alert' ? [68, 76, 82, 58, 74] : [38, 52, 64, 72, 82];
  heights.forEach((h, idx) => {
    ctx.fillStyle =
      variant === 'manager_alert' && idx > 1 ? '#f59e0b' : primary;
    ctx.fillRect(30 + idx * 30, 290 - h, 18, h);
  });

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  texture.needsUpdate = true;
  return texture;
}

/**
 * Generates a realistic industrial shipping crate / polymer tote texture with corrugated seams and barcode label.
 */
export function createCorrugatedCrateTexture(
  variant: 'cardboard' | 'polymer'
): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  if (variant === 'cardboard') {
    ctx.fillStyle = '#9c7853';
    ctx.fillRect(0, 0, size, size);

    // Corrugated fiber lines
    for (let y = 0; y < size; y += 4) {
      ctx.fillStyle = y % 8 === 0 ? 'rgba(65, 45, 25, 0.14)' : 'rgba(235, 208, 175, 0.08)';
      ctx.fillRect(0, y, size, 2);
    }

    // Packing tape band
    ctx.fillStyle = 'rgba(214, 184, 144, 0.55)';
    ctx.fillRect(0, size / 2 - 14, size, 28);

    // Crisp white shipping label + barcode
    ctx.fillStyle = '#f1f5f9';
    ctx.fillRect(28, 32, 92, 66);
    ctx.fillStyle = '#0f172a';
    for (let b = 0; b < 18; b++) {
      const bw = b % 3 === 0 ? 3 : 1.5;
      ctx.fillRect(36 + b * 4.2, 68, bw, 22);
    }
    ctx.fillStyle = '#334155';
    ctx.fillRect(36, 42, 64, 8);
    ctx.fillRect(36, 54, 44, 6);
  } else {
    ctx.fillStyle = '#253247';
    ctx.fillRect(0, 0, size, size);

    // Molded structural ribs
    ctx.fillStyle = '#1b2638';
    for (let x = 16; x < size; x += 32) {
      ctx.fillRect(x, 12, 10, size - 24);
    }
    // Industrial hazard / RFID tag
    ctx.fillStyle = '#e2e8f0';
    ctx.fillRect(156, 36, 72, 46);
    ctx.fillStyle = '#0ea5e9';
    ctx.fillRect(156, 36, 72, 12);
    ctx.fillStyle = '#0f172a';
    for (let b = 0; b < 12; b++) {
      ctx.fillRect(164 + b * 4.6, 56, b % 2 === 0 ? 2.5 : 1.5, 18);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}
