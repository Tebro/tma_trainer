import { Button } from './Button';
import { Panel } from './Panel';
import { TabGroup } from './TabGroup';
import { Tooltip } from './Tooltip';
import './DesignDemo.css';

export function DesignDemo() {
  return (
    <div className="design-demo">
      <h1 className="design-demo__heading">TMA Design System Reference</h1>

      {/* Color swatches */}
      <section className="design-demo__section">
        <h2 className="design-demo__section-title">Colors</h2>
        <div className="design-demo__swatches">
          <div className="design-demo__swatch-group">
            <h3 className="design-demo__group-label">Backgrounds</h3>
            <Swatch name="bg-deep" prop="--tma-bg-deep" />
            <Swatch name="bg-base" prop="--tma-bg-base" />
            <Swatch name="bg-surface" prop="--tma-bg-surface" />
            <Swatch name="bg-raised" prop="--tma-bg-raised" />
          </div>
          <div className="design-demo__swatch-group">
            <h3 className="design-demo__group-label">Text</h3>
            <Swatch name="text-primary" prop="--tma-text-primary" />
            <Swatch name="text-secondary" prop="--tma-text-secondary" />
            <Swatch name="text-muted" prop="--tma-text-muted" />
          </div>
          <div className="design-demo__swatch-group">
            <h3 className="design-demo__group-label">Accents</h3>
            <Swatch name="accent-cyan" prop="--tma-accent-cyan" />
            <Swatch name="accent-amber" prop="--tma-accent-amber" />
            <Swatch name="accent-magenta" prop="--tma-accent-magenta" />
            <Swatch name="accent-lime" prop="--tma-accent-lime" />
          </div>
          <div className="design-demo__swatch-group">
            <h3 className="design-demo__group-label">Semantic</h3>
            <Swatch name="color-error" prop="--tma-color-error" />
            <Swatch name="color-warning" prop="--tma-color-warning" />
            <Swatch name="color-success" prop="--tma-color-success" />
            <Swatch name="color-info" prop="--tma-color-info" />
          </div>
        </div>
      </section>

      {/* Typography */}
      <section className="design-demo__section">
        <h2 className="design-demo__section-title">Typography</h2>
        <p className="design-demo__text-xs">
          xs — 0.75rem — Bearing Rate Change
        </p>
        <p className="design-demo__text-sm">sm — 0.875rem — Contact Label</p>
        <p className="design-demo__text-base">
          base — 1rem — Estimated Range: 12.4 kyd
        </p>
        <p className="design-demo__text-lg">lg — 1.125rem — Tool Title</p>
        <p className="design-demo__text-xl">xl — 1.25rem — Page Section</p>
        <p className="design-demo__text-2xl">2xl — 1.5rem — App Header</p>
      </section>

      {/* Buttons */}
      <section className="design-demo__section">
        <h2 className="design-demo__section-title">Buttons</h2>
        <div className="design-demo__row">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button disabled>Disabled</Button>
          <Button variant="secondary" disabled>
            Disabled Secondary
          </Button>
        </div>
      </section>

      {/* Panel */}
      <section className="design-demo__section">
        <h2 className="design-demo__section-title">Panel</h2>
        <Panel title="Tactical Plot">
          <p>This is the panel content area.</p>
          <p>Supports any React children.</p>
        </Panel>
      </section>

      {/* Tabs */}
      <section className="design-demo__section">
        <h2 className="design-demo__section-title">TabGroup</h2>
        <Panel>
          <TabGroup
            tabs={[
              {
                id: 'plot',
                label: 'Plot',
                content: <p>Tactical plot goes here.</p>,
              },
              {
                id: 'data',
                label: 'Bearing Log',
                content: <p>Bearing history table goes here.</p>,
              },
              {
                id: 'estimates',
                label: 'Estimates',
                content: <p>Solution estimates go here.</p>,
              },
            ]}
          />
        </Panel>
      </section>

      {/* Tooltip */}
      <section className="design-demo__section">
        <h2 className="design-demo__section-title">Tooltip</h2>
        <div className="design-demo__row">
          <Tooltip text="Bearing line drawn from ownship to contact">
            <span className="design-demo__inline-target">
              Hover for tip (top)
            </span>
          </Tooltip>
          <Tooltip text="Speed estimate in knots" placement="bottom">
            <span className="design-demo__inline-target">
              Hover for tip (bottom)
            </span>
          </Tooltip>
          <Tooltip text="Contact identification number" placement="left">
            <span className="design-demo__inline-target">
              Hover for tip (left)
            </span>
          </Tooltip>
          <Tooltip text="Course in degrees true" placement="right">
            <span className="design-demo__inline-target">
              Hover for tip (right)
            </span>
          </Tooltip>
        </div>
      </section>
    </div>
  );
}

function Swatch({ name, prop }: { name: string; prop: string }) {
  return (
    <div className="design-demo__swatch">
      <div
        className="design-demo__swatch-color"
        style={{ backgroundColor: `var(${prop})` }}
      />
      <span className="design-demo__swatch-name">{name}</span>
    </div>
  );
}
