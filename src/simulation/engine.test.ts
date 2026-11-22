import test from 'node:test';
import assert from 'node:assert/strict';
import {
  AS_IS_LEG1,
  AS_IS_TRAVEL_SPEED,
  TO_BE_TRAVEL_SPEED,
  createInitialSimState,
  getHudSnapshot,
  getModeKpi,
  samplePolyline,
  setAutoSpawn,
  setSimSpeed,
  spawnPacket,
  stepSimulation,
  switchMode,
  toPersianDigits,
} from './engine';

test('toPersianDigits converts ASCII digits cleanly', () => {
  assert.equal(toPersianDigits(42), '۴۲');
  assert.equal(toPersianDigits('96%'), '۹۶%');
  assert.equal(toPersianDigits(1205), '۱۲۰۵');
});

test('mode KPIs match AS-IS and TO-BE specifications', () => {
  const asIs = getModeKpi('AS_IS');
  assert.equal(asIs.statusLabel, 'هشدار گلوگاه فرآیندی');
  assert.equal(asIs.cycleTimeLabel, '۴.۲ روز');
  assert.equal(asIs.efficiencyLabel, '۴۲٪');
  assert.equal(asIs.tone, 'amber');

  const toBe = getModeKpi('TO_BE');
  assert.equal(toBe.statusLabel, 'عملیات خودکار فعال است');
  assert.equal(toBe.cycleTimeLabel, '۱۲ دقیقه');
  assert.equal(toBe.efficiencyLabel, '۹۶٪');
  assert.equal(toBe.tone, 'emerald');
});

test('TO-BE movement speed is exactly 3x AS-IS speed', () => {
  assert.equal(TO_BE_TRAVEL_SPEED / AS_IS_TRAVEL_SPEED, 3);
});

test('samplePolyline clamps endpoints and computes smooth intermediate points', () => {
  const start = samplePolyline(AS_IS_LEG1, 0);
  const end = samplePolyline(AS_IS_LEG1, 1);
  const mid = samplePolyline(AS_IS_LEG1, 0.5);

  assert.equal(start.position.x, AS_IS_LEG1[0].x);
  assert.equal(end.position.x, AS_IS_LEG1[AS_IS_LEG1.length - 1].x);
  assert.ok(mid.position.x > start.position.x && mid.position.x < end.position.x);
});

test('initial AS-IS state seeds a visible queue bottleneck at Zone 2', () => {
  const state = createInitialSimState('AS_IS');
  const snap = getHudSnapshot(state);

  assert.equal(snap.mode, 'AS_IS');
  assert.ok(snap.queueCount >= 4, `Expected >= 4 queued items, got ${snap.queueCount}`);
  assert.ok(snap.bottleneckLevel >= 0.8);
});

test('switching from AS-IS to TO-BE clears the bottleneck queue immediately and boosts throughput', () => {
  const state = createInitialSimState('AS_IS');
  const before = getHudSnapshot(state);
  assert.ok(before.queueCount >= 4);

  switchMode(state, 'TO_BE');
  const immediatelyAfter = getHudSnapshot(state);
  assert.equal(immediatelyAfter.mode, 'TO_BE');
  assert.equal(immediatelyAfter.queueCount, 0);
  assert.equal(immediatelyAfter.bottleneckLevel, 0);
  assert.equal(state.aiPulseEnergy, 1.0);

  // Advance simulation 6 seconds in TO-BE and confirm packets complete through conveyor
  const startCompleted = state.completedCount;
  for (let i = 0; i < 120; i++) {
    stepSimulation(state, 0.05);
  }
  assert.ok(
    state.completedCount > startCompleted + 3,
    `Expected rapid completions in TO-BE, started ${startCompleted}, ended ${state.completedCount}`
  );
});

test('manual spawnPacket adds a packet at Zone 1 even when autoSpawn is off', () => {
  const state = createInitialSimState('TO_BE');
  setAutoSpawn(state, false);
  const initialCount = state.packets.length;

  const created = spawnPacket(state);
  assert.ok(created !== null);
  assert.equal(state.packets.length, initialCount + 1);
  assert.equal(created.stage, 'intake_to_approval');
  assert.equal(created.progress, 0);
});

test('2x speed multiplier doubles elapsed simulation time and conveyor travel', () => {
  const s1 = createInitialSimState('TO_BE');
  const s2 = createInitialSimState('TO_BE');
  setAutoSpawn(s1, false);
  setAutoSpawn(s2, false);
  setSimSpeed(s1, 1);
  setSimSpeed(s2, 2);

  for (let i = 0; i < 10; i++) {
    stepSimulation(s1, 0.05);
    stepSimulation(s2, 0.05);
  }

  assert.ok(Math.abs(s2.elapsed - s1.elapsed * 2) < 1e-6);
});
