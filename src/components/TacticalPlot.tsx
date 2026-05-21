import { useMemo, useState, type MouseEvent } from 'react';
import type {
  Observation,
  Estimate,
  Ownship,
  Scenario,
  Vector2,
} from '../simulation/scenarioTypes';
import type { EntityState } from '../simulation/tracks';
import { computeEntityState, generateTruthTrack } from '../simulation/tracks';
import {
  bearingToTarget,
  courseToVector,
  distanceBetween,
  polarToCartesian,
} from '../simulation/geometry';
import './TacticalPlot.css';

interface Props {
  ownship: EntityState;
  contactTruth: Record<string, EntityState>;
  observations: Observation[];
  estimates?: Estimate[];
  scenario?: Scenario;
  ownshipTrack?: Ownship;
  showPossiblePositions?: boolean;
  hypothesisPoint?: Vector2 | null;
  onCursorPick?: (data: {
    position: Vector2;
    rangeYds: number;
    bearingDeg: number;
  }) => void;
  currentTimeSec: number;
  showTruth: boolean;
  layerVisibility?: PlotLayerVisibility;
  width?: number;
  height?: number;
}

export interface PlotLayerVisibility {
  bearingLines: boolean;
  ownshipPath: boolean;
  contactPaths: boolean;
  estimates: boolean;
  errorLines: boolean;
}

const DEFAULT_PLOT_LAYER_VISIBILITY: PlotLayerVisibility = {
  bearingLines: true,
  ownshipPath: true,
  contactPaths: true,
  estimates: true,
  errorLines: true,
};

const PADDING_PX = 40;
const LINE_LENGTH = 20000;

export function TacticalPlot({
  ownship,
  contactTruth,
  observations,
  estimates = [],
  scenario,
  ownshipTrack,
  showPossiblePositions = false,
  hypothesisPoint,
  onCursorPick,
  currentTimeSec,
  showTruth,
  layerVisibility = DEFAULT_PLOT_LAYER_VISIBILITY,
  width = 600,
  height = 400,
}: Props) {
  const [cursor, setCursor] = useState<Vector2 | null>(null);
  const bounds = useViewportBounds(
    ownship,
    contactTruth,
    observations,
    ownshipTrack,
    scenario,
    estimates,
    showTruth
  );

  const { sx, sy } = useScale(bounds, width, height);

  const cursorWorld = useMemo(
    () => (cursor ? screenToWorld(cursor, bounds, width, height) : null),
    [bounds, cursor, height, width]
  );

  const grid = useGrid(bounds, width, height);

  // Group observations by contact for history rendering
  const obsByContact = useMemo(() => {
    const grouped: Record<string, Observation[]> = {};
    for (const obs of observations) {
      if (!grouped[obs.contactId]) grouped[obs.contactId] = [];
      grouped[obs.contactId].push(obs);
    }
    return grouped;
  }, [observations]);

  return (
    <svg
      className="tactical-plot"
      viewBox={`0 0 ${width} ${height}`}
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      onMouseMove={(event) => {
        setCursor(getSvgPoint(event));
      }}
      onMouseLeave={() => setCursor(null)}
      onClick={() => {
        if (!cursorWorld || !onCursorPick) return;
        onCursorPick({
          position: cursorWorld,
          rangeYds: distanceBetween(ownship.position, cursorWorld),
          bearingDeg: bearingToTarget(ownship.position, cursorWorld),
        });
      }}
    >
      {/* Background */}
      <rect width={width} height={height} fill="var(--tma-plot-bg, #0a0a15)" />

      {/* Grid */}
      <g className="plot-grid">
        {grid.map((line) => (
          <line
            key={line.key}
            x1={line.x1}
            y1={line.y1}
            x2={line.x2}
            y2={line.y2}
          />
        ))}
      </g>

      {showTruth && scenario && (
        <g className="truth-tracks">
          {layerVisibility.ownshipPath && (
            <polyline
              className="truth-track truth-track--ownship"
              points={trackPoints(
                scenario.ownship,
                scenario.durationSec,
                sx,
                sy
              )}
            />
          )}
          {layerVisibility.contactPaths &&
            scenario.contacts.map((contact) => (
              <polyline
                key={`track-${contact.id}`}
                className="truth-track truth-track--contact"
                points={trackPoints(contact, scenario.durationSec, sx, sy)}
              />
            ))}
        </g>
      )}

      {/* Bearing history for each contact */}
      {layerVisibility.bearingLines &&
        Object.entries(obsByContact).map(([contactId, obsList]) => (
          <g key={`history-${contactId}`} className="bearing-history">
            {/* Previous bearings shown fainter than most recent */}
            {obsList.map((obs, idx) => {
              const isLatest = idx === obsList.length - 1;
              const origin = getOwnshipPositionAtObservation(
                ownship,
                ownshipTrack,
                obs.timestampSec
              );
              const end = bearingLineEnd(origin, obs.bearingDeg, LINE_LENGTH);
              return (
                <line
                  key={`obs-${obs.timestampSec}-${contactId}`}
                  x1={sx(origin.x)}
                  y1={sy(origin.y)}
                  x2={sx(end.x)}
                  y2={sy(end.y)}
                  stroke={isLatest ? '#b8d7ff' : '#6f9fe0'}
                  strokeWidth={isLatest ? 1.8 : 1.15}
                  strokeDasharray={isLatest ? '4,4' : '3,7'}
                  strokeOpacity={isLatest ? 0.85 : 0.5}
                />
              );
            })}
          </g>
        ))}

      {showPossiblePositions &&
        Object.entries(obsByContact).map(([contactId, obsList]) => {
          const latest = obsList[obsList.length - 1];
          if (!latest) return null;
          const origin = getOwnshipPositionAtObservation(
            ownship,
            ownshipTrack,
            latest.timestampSec
          );
          return (
            <g key={`possible-${contactId}`} className="possible-positions">
              {[3000, 6000, 9000, 12000].map((range) => {
                const point = polarToCartesian(
                  range,
                  latest.bearingDeg,
                  origin
                );
                return (
                  <g key={`${contactId}-${range}`}>
                    <circle cx={sx(point.x)} cy={sy(point.y)} r={4} />
                    <text x={sx(point.x) + 7} y={sy(point.y) - 6}>
                      possible {range / 1000}k
                    </text>
                  </g>
                );
              })}
            </g>
          );
        })}

      {layerVisibility.estimates && (
        <g className="estimate-markers">
          {estimates.map((estimate, index) => {
            const matchingObservations = observations.filter(
              (o) =>
                o.contactId === estimate.contactId &&
                o.timestampSec <= estimate.timestampSec
            );
            const obs = matchingObservations[matchingObservations.length - 1];
            if (!obs) return null;
            const origin = getOwnshipPositionAtObservation(
              ownship,
              ownshipTrack,
              obs.timestampSec
            );
            const point = polarToCartesian(
              estimate.rangeYds,
              obs.bearingDeg,
              origin
            );
            return (
              <g key={`estimate-${estimate.contactId}-${index}`}>
                <circle cx={sx(point.x)} cy={sy(point.y)} r={5} />
                <text x={sx(point.x) + 8} y={sy(point.y) + 4}>
                  est {index + 1}
                </text>
              </g>
            );
          })}
        </g>
      )}

      {layerVisibility.errorLines && showTruth && scenario && (
        <g className="estimate-errors">
          {estimates.map((estimate, index) => {
            const visual = estimateVisual(
              estimate,
              observations,
              ownship,
              ownshipTrack,
              scenario
            );
            if (!visual) return null;
            const errorYds = distanceBetween(
              visual.estimatedPoint,
              visual.truthPoint
            );
            return (
              <g key={`estimate-error-${estimate.contactId}-${index}`}>
                <line
                  x1={sx(visual.estimatedPoint.x)}
                  y1={sy(visual.estimatedPoint.y)}
                  x2={sx(visual.truthPoint.x)}
                  y2={sy(visual.truthPoint.y)}
                />
                <text
                  x={
                    (sx(visual.estimatedPoint.x) + sx(visual.truthPoint.x)) / 2
                  }
                  y={
                    (sy(visual.estimatedPoint.y) + sy(visual.truthPoint.y)) /
                      2 -
                    4
                  }
                >
                  err {Math.round(errorYds)} yd
                </text>
              </g>
            );
          })}
        </g>
      )}

      {hypothesisPoint && (
        <g className="hypothesis-marker">
          <circle cx={sx(hypothesisPoint.x)} cy={sy(hypothesisPoint.y)} r={7} />
          <text x={sx(hypothesisPoint.x) + 10} y={sy(hypothesisPoint.y) - 8}>
            hypothesis
          </text>
        </g>
      )}

      {/* Truth contact markers */}
      {showTruth &&
        Object.entries(contactTruth).map(([id, c]) => (
          <g key={`truth-${id}`}>
            {(() => {
              const courseVector = courseToVector(c.course);
              return (
                <line
                  x1={sx(c.position.x)}
                  y1={sy(c.position.y)}
                  x2={sx(c.position.x + 2000 * courseVector.x)}
                  y2={sy(c.position.y + 2000 * courseVector.y)}
                  stroke="#00ff88"
                  strokeWidth={1.5}
                  strokeOpacity={0.6}
                  markerEnd="url(#arrowhead)"
                />
              );
            })()}
            <circle
              cx={sx(c.position.x)}
              cy={sy(c.position.y)}
              r={6}
              fill="none"
              stroke="#00ff88"
              strokeWidth={2}
            />
            <text
              x={sx(c.position.x) + 10}
              y={sy(c.position.y) - 10}
              fill="#00ff88"
              fontSize={10}
              fontFamily="system-ui"
            >
              {id}
            </text>
          </g>
        ))}

      {/* Timeline cursor — horizontal line at current time? No, time cursor
          in a tactical plot is odd. Instead show a time indicator in the corner. */}
      <g className="plot-overlay">
        {/* Time indicator box */}
        <rect
          x={width - 110}
          y={8}
          width={100}
          height={22}
          rx={4}
          fill="rgba(10, 10, 30, 0.8)"
          stroke="#2a2a4a"
          strokeWidth={1}
        />
        <text
          x={width - 60}
          y={22}
          textAnchor="middle"
          fill="#d0d0e0"
          fontSize={11}
          fontFamily="system-ui, monospace"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          T+{formatTime(currentTimeSec)}
        </text>

        <rect
          x={8}
          y={8}
          width={132}
          height={38}
          rx={4}
          fill="rgba(10, 10, 30, 0.8)"
          stroke="#2a2a4a"
          strokeWidth={1}
        />
        <text
          x={16}
          y={23}
          fill="#d0d0e0"
          fontSize={11}
          fontFamily="system-ui, monospace"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          CRS {ownship.course.toFixed(0).padStart(3, '0')}°
        </text>
        <text
          x={16}
          y={38}
          fill="#d0d0e0"
          fontSize={11}
          fontFamily="system-ui, monospace"
          style={{ fontVariantNumeric: 'tabular-nums' }}
        >
          SPD {ownship.speed.toFixed(1)} kt
        </text>
      </g>

      {cursor && cursorWorld && (
        <CursorReadout
          cursor={cursor}
          cursorWorld={cursorWorld}
          ownshipPosition={ownship.position}
        />
      )}

      {/* Arrowhead marker definition */}
      <defs>
        <marker
          id="arrowhead"
          markerWidth={6}
          markerHeight={6}
          refX={5}
          refY={3}
          orient="auto"
        >
          <polygon points="0 0, 6 3, 0 6" fill="#00ff88" />
        </marker>
      </defs>

      {/* Ownship marker (drawn on top) */}
      <OwnshipMarker
        x={sx(ownship.position.x)}
        y={sy(ownship.position.y)}
        course={ownship.course}
      />
    </svg>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function useViewportBounds(
  ownship: EntityState,
  contactTruth: Record<string, EntityState>,
  observations: Observation[],
  ownshipTrack: Ownship | undefined,
  scenario: Scenario | undefined,
  estimates: Estimate[],
  showTruth: boolean
) {
  return useMemo(() => {
    let minX = ownship.position.x - 8000;
    let maxX = ownship.position.x + 8000;
    let minY = ownship.position.y - 6000;
    let maxY = ownship.position.y + 6000;

    for (const obs of observations) {
      const origin = getOwnshipPositionAtObservation(
        ownship,
        ownshipTrack,
        obs.timestampSec
      );
      const end = bearingLineEnd(origin, obs.bearingDeg, 12000);
      minX = Math.min(minX, origin.x);
      maxX = Math.max(maxX, origin.x);
      minY = Math.min(minY, origin.y);
      maxY = Math.max(maxY, origin.y);
      minX = Math.min(minX, end.x);
      maxX = Math.max(maxX, end.x);
      minY = Math.min(minY, end.y);
      maxY = Math.max(maxY, end.y);
    }

    if (showTruth) {
      for (const id in contactTruth) {
        const c = contactTruth[id];
        minX = Math.min(minX, c.position.x);
        maxX = Math.max(maxX, c.position.x);
        minY = Math.min(minY, c.position.y);
        maxY = Math.max(maxY, c.position.y);
      }

      if (scenario) {
        for (const sample of generateTruthTrack(
          scenario.ownship,
          scenario.durationSec,
          Math.max(10, scenario.sensor.updateIntervalSec)
        )) {
          minX = Math.min(minX, sample.state.position.x);
          maxX = Math.max(maxX, sample.state.position.x);
          minY = Math.min(minY, sample.state.position.y);
          maxY = Math.max(maxY, sample.state.position.y);
        }

        for (const contact of scenario.contacts) {
          for (const sample of generateTruthTrack(
            contact,
            scenario.durationSec,
            Math.max(10, scenario.sensor.updateIntervalSec)
          )) {
            minX = Math.min(minX, sample.state.position.x);
            maxX = Math.max(maxX, sample.state.position.x);
            minY = Math.min(minY, sample.state.position.y);
            maxY = Math.max(maxY, sample.state.position.y);
          }
        }

        for (let index = 0; index < estimates.length; index++) {
          const visual = estimateVisual(
            estimates[index],
            observations,
            ownship,
            ownshipTrack,
            scenario
          );
          if (!visual) continue;
          minX = Math.min(minX, visual.estimatedPoint.x, visual.truthPoint.x);
          maxX = Math.max(maxX, visual.estimatedPoint.x, visual.truthPoint.x);
          minY = Math.min(minY, visual.estimatedPoint.y, visual.truthPoint.y);
          maxY = Math.max(maxY, visual.estimatedPoint.y, visual.truthPoint.y);
        }
      }
    }

    minX -= 1000;
    maxX += 1000;
    minY -= 1000;
    maxY += 1000;

    return { minX, maxX, minY, maxY };
  }, [
    ownship,
    observations,
    ownshipTrack,
    scenario,
    estimates,
    contactTruth,
    showTruth,
  ]);
}

function getOwnshipPositionAtObservation(
  currentOwnship: EntityState,
  ownshipTrack: Ownship | undefined,
  timestampSec: number
): Vector2 {
  return ownshipTrack
    ? computeEntityState(ownshipTrack, timestampSec).position
    : currentOwnship.position;
}

function getSvgPoint(event: MouseEvent<SVGSVGElement>): Vector2 {
  const svg = event.currentTarget;
  const point = svg.createSVGPoint();
  point.x = event.clientX;
  point.y = event.clientY;

  const matrix = svg.getScreenCTM();
  if (!matrix) return { x: 0, y: 0 };

  const transformed = point.matrixTransform(matrix.inverse());
  return { x: transformed.x, y: transformed.y };
}

function screenToWorld(
  point: Vector2,
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  width: number,
  height: number
): Vector2 {
  const usableW = width - PADDING_PX * 2;
  const usableH = height - PADDING_PX * 2;
  const xRatio = (point.x - PADDING_PX) / usableW;
  const yRatio = (point.y - PADDING_PX) / usableH;

  return {
    x: bounds.minX + xRatio * (bounds.maxX - bounds.minX),
    y: bounds.maxY - yRatio * (bounds.maxY - bounds.minY),
  };
}

function trackPoints(
  entity: Ownship | Scenario['contacts'][number],
  durationSec: number,
  sx: (worldX: number) => number,
  sy: (worldY: number) => number
): string {
  return generateTruthTrack(entity, durationSec, 20)
    .map(({ state }) => `${sx(state.position.x)},${sy(state.position.y)}`)
    .join(' ');
}

function estimateVisual(
  estimate: Estimate,
  observations: Observation[],
  ownship: EntityState,
  ownshipTrack: Ownship | undefined,
  scenario: Scenario
): { estimatedPoint: Vector2; truthPoint: Vector2 } | null {
  const matchingObservations = observations.filter(
    (o) =>
      o.contactId === estimate.contactId &&
      o.timestampSec <= estimate.timestampSec
  );
  const obs = matchingObservations[matchingObservations.length - 1];
  const contact = scenario.contacts.find((c) => c.id === estimate.contactId);
  if (!obs || !contact) return null;

  const origin = getOwnshipPositionAtObservation(
    ownship,
    ownshipTrack,
    obs.timestampSec
  );
  return {
    estimatedPoint: polarToCartesian(estimate.rangeYds, obs.bearingDeg, origin),
    truthPoint: computeEntityState(contact, estimate.timestampSec).position,
  };
}

function useScale(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  width: number,
  height: number
) {
  return useMemo(() => {
    const viewW = bounds.maxX - bounds.minX;
    const viewH = bounds.maxY - bounds.minY;

    const sx = (worldX: number) =>
      ((worldX - bounds.minX) / viewW) * (width - PADDING_PX * 2) + PADDING_PX;
    const sy = (worldY: number) =>
      ((bounds.maxY - worldY) / viewH) * (height - PADDING_PX * 2) + PADDING_PX;

    return { sx, sy };
  }, [bounds, width, height]);
}

function useGrid(
  bounds: { minX: number; maxX: number; minY: number; maxY: number },
  width: number,
  height: number
) {
  return useMemo(() => {
    const scaleLines: Array<{
      key: string;
      x1: number;
      y1: number;
      x2: number;
      y2: number;
    }> = [];

    const viewW = bounds.maxX - bounds.minX;
    const gridStep = Math.max(2000, Math.round(viewW / 10 / 1000) * 1000);

    for (
      let gx = Math.floor(bounds.minX / gridStep) * gridStep;
      gx <= bounds.maxX;
      gx += gridStep
    ) {
      const x =
        ((gx - bounds.minX) / viewW) * (width - PADDING_PX * 2) + PADDING_PX;
      scaleLines.push({
        key: `gx-${gx}`,
        x1: x,
        y1: PADDING_PX,
        x2: x,
        y2: height - PADDING_PX,
      });
    }

    const viewH = bounds.maxY - bounds.minY;
    for (
      let gy = Math.floor(bounds.minY / gridStep) * gridStep;
      gy <= bounds.maxY;
      gy += gridStep
    ) {
      const y =
        ((bounds.maxY - gy) / viewH) * (height - PADDING_PX * 2) + PADDING_PX;
      scaleLines.push({
        key: `gy-${gy}`,
        x1: PADDING_PX,
        y1: y,
        x2: width - PADDING_PX,
        y2: y,
      });
    }

    return scaleLines;
  }, [bounds, width, height]);
}

function OwnshipMarker({
  x,
  y,
  course,
}: {
  x: number;
  y: number;
  course: number;
}) {
  const size = 8;
  const rad = ((course - 90) * Math.PI) / 180;
  const points = [
    [Math.cos(rad) * size, Math.sin(rad) * size],
    [
      Math.cos(rad + (2.5 * Math.PI) / 3) * size,
      Math.sin(rad + (2.5 * Math.PI) / 3) * size,
    ],
    [
      Math.cos(rad - (2.5 * Math.PI) / 3) * size,
      Math.sin(rad - (2.5 * Math.PI) / 3) * size,
    ],
  ]
    .map(([px, py]) => `${x + px},${y + py}`)
    .join(' ');

  return (
    <g>
      <polygon
        points={points}
        fill="#00ccff"
        stroke="#00aadd"
        strokeWidth={1}
      />
      <circle cx={x} cy={y} r={2} fill="#ffffff" />
      <circle
        cx={x}
        cy={y}
        r={12}
        fill="none"
        stroke="#00ccff"
        strokeOpacity={0.15}
        strokeWidth={1}
      />
    </g>
  );
}

function CursorReadout({
  cursor,
  cursorWorld,
  ownshipPosition,
}: {
  cursor: Vector2;
  cursorWorld: Vector2;
  ownshipPosition: Vector2;
}) {
  const rangeYds = distanceBetween(ownshipPosition, cursorWorld);
  const bearingDeg = bearingToTarget(ownshipPosition, cursorWorld);
  const labelX = cursor.x > 420 ? cursor.x - 150 : cursor.x + 12;
  const labelY = cursor.y > 330 ? cursor.y - 56 : cursor.y + 12;

  return (
    <g className="cursor-readout">
      <line x1={cursor.x - 6} y1={cursor.y} x2={cursor.x + 6} y2={cursor.y} />
      <line x1={cursor.x} y1={cursor.y - 6} x2={cursor.x} y2={cursor.y + 6} />
      <rect x={labelX} y={labelY} width={138} height={44} rx={4} />
      <text x={labelX + 8} y={labelY + 17}>
        RNG {Math.round(rangeYds)} yd
      </text>
      <text x={labelX + 8} y={labelY + 34}>
        BRG {bearingDeg.toFixed(1)}°
      </text>
    </g>
  );
}

function bearingLineEnd(
  origin: Vector2,
  bearingDeg: number,
  length: number
): Vector2 {
  const rad = (bearingDeg * Math.PI) / 180;
  return {
    x: origin.x + length * Math.sin(rad),
    y: origin.y + length * Math.cos(rad),
  };
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
