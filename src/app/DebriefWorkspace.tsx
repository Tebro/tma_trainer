import { useMemo, useState } from 'react';
import { generateDebrief } from '../scoring/estimateScoring';
import type { Estimate, Scenario } from '../simulation/scenarioTypes';
import type { TruthSnapshot } from '../simulation/playback';
import {
  TacticalPlot,
  type PlotLayerVisibility,
} from '../components/TacticalPlot';
import { DebriefView } from '../components/DebriefView';

interface Props {
  scenario: Scenario;
  truthState: TruthSnapshot;
  observations: Array<{
    timestampSec: number;
    observations: import('../simulation/scenarioTypes').Observation[];
  }>;
  estimates: Estimate[];
  title?: string;
  onRetry: () => void;
  onBack: () => void;
}

const DEFAULT_PLOT_LAYER_VISIBILITY: PlotLayerVisibility = {
  bearingLines: true,
  ownshipPath: true,
  contactPaths: true,
  estimates: true,
  errorLines: true,
};

export function DebriefWorkspace({
  scenario,
  truthState,
  observations,
  estimates,
  onRetry,
  onBack,
}: Props) {
  const [layerVisibility, setLayerVisibility] = useState<PlotLayerVisibility>(
    DEFAULT_PLOT_LAYER_VISIBILITY
  );

  const debrief = useMemo(
    () => generateDebrief(scenario, estimates),
    [scenario, estimates]
  );

  const flatObservations = useMemo(
    () => observations.flatMap((o) => o.observations),
    [observations]
  );

  return (
    <div className="app-workspace">
      <header className="app-header">
        <h1>TMA Trainer — Debrief</h1>
        <button className="app-header__back" onClick={onBack} type="button">
          Library
        </button>
      </header>
      <main className="app-main">
        <section className="panel panel-plot">
          <PlotLayerControls
            value={layerVisibility}
            onChange={setLayerVisibility}
          />
          <TacticalPlot
            ownship={truthState.ownship}
            contactTruth={truthState.contacts}
            observations={flatObservations}
            estimates={estimates}
            scenario={scenario}
            ownshipTrack={scenario.ownship}
            currentTimeSec={truthState.timestampSec}
            showTruth={true}
            layerVisibility={layerVisibility}
          />
        </section>
        <aside className="panel panel-contacts">
          <DebriefView debrief={debrief} onRetry={onRetry} />
        </aside>
      </main>
    </div>
  );
}

function PlotLayerControls({
  value,
  onChange,
}: {
  value: PlotLayerVisibility;
  onChange: (value: PlotLayerVisibility) => void;
}) {
  const labels: Array<[keyof PlotLayerVisibility, string]> = [
    ['bearingLines', 'Bearings'],
    ['ownshipPath', 'Ownship Path'],
    ['contactPaths', 'Contact Paths'],
    ['estimates', 'Estimates'],
    ['errorLines', 'Errors'],
  ];

  return (
    <div className="plot-layer-controls">
      {labels.map(([key, label]) => (
        <label key={key} className={`plot-layer-control plot-layer-${key}`}>
          <input
            type="checkbox"
            checked={value[key]}
            onChange={(event) =>
              onChange({ ...value, [key]: event.target.checked })
            }
          />
          {label}
        </label>
      ))}
    </div>
  );
}
