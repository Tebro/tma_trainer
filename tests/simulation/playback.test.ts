import { describe, expect, it, vi } from 'vitest';
import { ScenarioPlayback } from '../../src/simulation/playback';

function makeScenario(durationSec = 300, contactsCount = 1) {
  return {
    id: 'test-scenario',
    title: 'Test',
    ownship: {
      position: { x: 0, y: 0 },
      course: 90,
      speed: 10,
      maneuvers: [
        { timeSec: 120, course: 0 },
        { timeSec: 180, speed: 5 },
      ],
    },
    contacts: Array.from({ length: contactsCount }, (_, i) => ({
      id: `C${i}`,
      category: 'submarine' as const,
      position: { x: 5000, y: 0 },
      course: 270,
      speed: 8,
      maneuvers: [{ timeSec: 150, speed: 12 }],
    })),
    sensor: {
      bearingNoiseDeg: 1.0,
      updateIntervalSec: 20,
      classificationAmbiguity: 'low' as const,
    },
    environment: {},
    tasks: [],
    hints: [],
    debriefRules: [],
    durationSec,
  };
}

describe('ScenarioPlayback construction', () => {
  it('starts at t=0', () => {
    const pb = new ScenarioPlayback(makeScenario());
    expect(pb.currentTime).toBe(0);
    expect(pb.isPlaying).toBe(false);
    expect(pb.speed).toBe(1);
  });

  it('exposes scenario id and duration', () => {
    const pb = new ScenarioPlayback(makeScenario(600));
    expect(pb.scenarioId).toBe('test-scenario');
    expect(pb.durationSec).toBe(600);
  });
});

describe('time controls', () => {
  it('step advances time', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.step(10);
    expect(pb.currentTime).toBe(10);
  });

  it('step respects speed multiplier', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setSpeed(2);
    pb.step(5);
    expect(pb.currentTime).toBe(10);
  });

  it('setTime jumps to absolute time', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(100);
    expect(pb.currentTime).toBe(100);
  });

  it('time clamped to 0', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(-50);
    expect(pb.currentTime).toBe(0);
  });

  it('time clamped to duration', () => {
    const pb = new ScenarioPlayback(makeScenario(120));
    pb.setTime(500);
    expect(pb.currentTime).toBe(120);
  });

  it('step clamps to duration', () => {
    const pb = new ScenarioPlayback(makeScenario(50));
    pb.setTime(45);
    pb.step(20);
    expect(pb.currentTime).toBe(50);
  });

  it('reset returns to 0 and stops playback', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(100);
    pb.play();
    pb.reset();
    expect(pb.currentTime).toBe(0);
    expect(pb.isPlaying).toBe(false);
  });
});

describe('play / pause / toggle', () => {
  it('play sets isPlaying to true', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.play();
    expect(pb.isPlaying).toBe(true);
    pb.dispose();
  });

  it('play advances one simulated second per real second at 1x', () => {
    vi.useFakeTimers();
    const pb = new ScenarioPlayback(makeScenario());

    try {
      pb.play();
      vi.advanceTimersByTime(1000);

      expect(pb.currentTime).toBe(1);
    } finally {
      pb.dispose();
      vi.useRealTimers();
    }
  });

  it('pause sets isPlaying to false', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.play();
    pb.pause();
    expect(pb.isPlaying).toBe(false);
    pb.dispose();
  });

  it('toggle switches state', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.toggle();
    expect(pb.isPlaying).toBe(true);
    pb.toggle();
    expect(pb.isPlaying).toBe(false);
    pb.dispose();
  });

  it('play at speed 0 does not start', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setSpeed(0);
    pb.play();
    expect(pb.isPlaying).toBe(false);
  });

  it('dispose stops playback', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.play();
    pb.dispose();
    expect(pb.isPlaying).toBe(false);
  });
});

describe('speed controls', () => {
  it('setSpeed changes speed', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setSpeed(4);
    expect(pb.speed).toBe(4);
  });

  it('invalid speed is ignored', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setSpeed(99 as never);
    expect(pb.speed).toBe(1);
  });

  it('setSpeed 0 pauses playback', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.play();
    pb.setSpeed(0);
    expect(pb.isPlaying).toBe(false);
    expect(pb.speed).toBe(0);
  });

  it('nextSpeed cycles up', () => {
    const pb = new ScenarioPlayback(makeScenario());
    expect(pb.speed).toBe(1);
    pb.nextSpeed();
    expect(pb.speed).toBe(2);
    pb.nextSpeed();
    expect(pb.speed).toBe(4);
  });

  it('nextSpeed caps at max', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setSpeed(8);
    pb.nextSpeed();
    expect(pb.speed).toBe(8);
  });

  it('prevSpeed cycles down', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setSpeed(4);
    pb.prevSpeed();
    expect(pb.speed).toBe(2);
    pb.prevSpeed();
    expect(pb.speed).toBe(1);
  });

  it('prevSpeed floors at 0', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setSpeed(0);
    pb.prevSpeed();
    expect(pb.speed).toBe(0);
  });
});

describe('truth state lookup', () => {
  it('returns initial state at t=0', () => {
    const pb = new ScenarioPlayback(makeScenario());
    const truth = pb.getTruthState();
    expect(truth.timestampSec).toBe(0);
    expect(truth.ownship.position).toEqual({ x: 0, y: 0 });
    expect(truth.ownship.course).toBe(90);
    expect(truth.ownship.speed).toBe(10);
    expect(truth.contacts.C0.position).toEqual({ x: 5000, y: 0 });
    expect(truth.contacts.C0.course).toBe(270);
    expect(truth.contacts.C0.speed).toBe(8);
  });

  it('returns propagated state at later time', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(60);
    const truth = pb.getTruthState();
    // Ownship moving east for 60s → x > 0
    expect(truth.ownship.position.x).toBeGreaterThan(0);
    // Ownship hasn't turned yet
    expect(truth.ownship.course).toBe(90);
    // Contact moving west for 60s → x < 5000
    expect(truth.contacts.C0.position.x).toBeLessThan(5000);
  });

  it('applies maneuvers at correct time', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(60);
    expect(pb.getTruthState().ownship.course).toBe(90);

    pb.setTime(120);
    // Right at maneuver time — course should have changed to 0
    expect(pb.getTruthState().ownship.course).toBe(0);

    pb.setTime(180);
    // Speed changed to 5 at 180s
    expect(pb.getTruthState().ownship.speed).toBe(5);
  });

  it('getTruthStateAt returns state at arbitrary time', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(100);
    // getTruthState returns t=100
    expect(pb.getTruthState().timestampSec).toBe(100);
    // getTruthStateAt(50) returns t=50 regardless of current time
    const at50 = pb.getTruthStateAt(50);
    expect(at50.timestampSec).toBe(50);
    expect(at50.ownship.course).toBe(90);
    expect(pb.getTruthState().timestampSec).toBe(100); // current time unchanged
  });

  it('getTruthStateAt clamps to valid range', () => {
    const pb = new ScenarioPlayback(makeScenario(100));
    const negative = pb.getTruthStateAt(-10);
    expect(negative.timestampSec).toBe(0);
    const over = pb.getTruthStateAt(200);
    expect(over.timestampSec).toBe(100);
  });

  it('returns all contacts', () => {
    const pb = new ScenarioPlayback(makeScenario(300, 3));
    const truth = pb.getTruthState();
    expect(Object.keys(truth.contacts)).toHaveLength(3);
    expect(truth.contacts.C0).toBeDefined();
    expect(truth.contacts.C1).toBeDefined();
    expect(truth.contacts.C2).toBeDefined();
  });
});

describe('observations', () => {
  it('returns observations at interval boundaries', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(0);
    const obs0 = pb.getObservations();
    expect(obs0.length).toBeGreaterThan(0);

    pb.setTime(10);
    const obs10 = pb.getObservations();
    expect(obs10).toHaveLength(0); // 10 is not a multiple of 20

    pb.setTime(20);
    const obs20 = pb.getObservations();
    expect(obs20.length).toBeGreaterThan(0);
  });

  it('observations are deterministic', () => {
    const pb = new ScenarioPlayback(makeScenario(), 'seed-1');
    pb.setTime(20);
    const obs1 = pb.getObservations();
    const obs2 = pb.getObservations();
    expect(obs1).toEqual(obs2);
  });

  it('getObservationsUpToCurrent returns history', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(40);
    const history = pb.getObservationsUpToCurrent();
    expect(history.length).toBe(3); // 0, 20, 40
    expect(history[0].timestampSec).toBe(0);
    expect(history[1].timestampSec).toBe(20);
    expect(history[2].timestampSec).toBe(40);
  });

  it('observations include contact-specific data', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(0);
    const obs = pb.getObservations();
    expect(obs.length).toBe(1);
    expect(obs[0].contactId).toBe('C0');
    expect(obs[0].bearingDeg).toBeGreaterThanOrEqual(0);
    expect(obs[0].bearingDeg).toBeLessThan(360);
    expect(obs[0].timestampSec).toBe(0);
  });
});

describe('determinism and state isolation', () => {
  it('stepping forward is deterministic', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.step(10);
    pb.step(20);
    expect(pb.currentTime).toBe(30);

    const pb2 = new ScenarioPlayback(makeScenario());
    pb2.setTime(30);
    expect(pb.getTruthState()).toEqual(pb2.getTruthState());
  });

  it('rewinding restores expected state', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.setTime(60);
    const state60 = pb.getTruthState();
    pb.setTime(120);
    const state120 = pb.getTruthState();
    // 120s ownship has turned north (maneuver at 120)
    expect(state120.ownship.course).toBe(0);
    // Rewind to 60s — ownship should still be east
    pb.setTime(60);
    expect(pb.getTruthState().ownship.course).toBe(90);
    expect(pb.getTruthState()).toEqual(state60);
  });

  it('reset restores initial state', () => {
    const pb = new ScenarioPlayback(makeScenario());
    pb.step(100);
    pb.reset();
    expect(pb.currentTime).toBe(0);
    const truth = pb.getTruthState();
    expect(truth.ownship.position).toEqual({ x: 0, y: 0 });
    expect(truth.ownship.course).toBe(90);
    expect(truth.ownship.speed).toBe(10);
  });

  it('does not depend on hidden global state', () => {
    const pb1 = new ScenarioPlayback(makeScenario());
    const pb2 = new ScenarioPlayback(makeScenario());
    pb1.step(50);
    pb2.step(30);
    expect(pb1.currentTime).toBe(50);
    expect(pb2.currentTime).toBe(30);
  });
});
