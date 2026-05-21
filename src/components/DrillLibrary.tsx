import { useState } from 'react';
import {
  type DrillDifficulty,
  type DrillTemplate,
  getDrillTemplateIds,
} from '../simulation/drillGenerator';
import './DrillLibrary.css';

const TEMPLATE_LABELS: Record<DrillTemplate, { name: string; desc: string }> = {
  'constant-bearing': {
    name: 'Constant Bearing',
    desc: 'Contact maintains near-constant relative bearing. Classic collision-course setup.',
  },
  crossing: {
    name: 'Crossing Contact',
    desc: 'Contact crosses your track at an angle. Fast bearing rate near beam.',
  },
  opening: {
    name: 'Opening Contact',
    desc: 'Contact is pulling away. Bearing drifts slowly as range increases.',
  },
  closing: {
    name: 'Closing Contact',
    desc: 'Contact is approaching. Range decreases; estimate quickly.',
  },
  'two-contact-classification': {
    name: 'Two-Contact Classification',
    desc: 'Two contacts with different signatures. Focus on acoustic cues.',
  },
  'high-noise-bearing-only': {
    name: 'High-Noise Bearing-Only',
    desc: 'Sparse, noisy bearings. Focus on trend instead of individual lines.',
  },
  'maneuver-timing': {
    name: 'Maneuver Timing',
    desc: 'Practice when to maneuver ownship to improve bearing geometry.',
  },
  'rapid-estimate': {
    name: 'Rapid Estimate',
    desc: 'Short time limit. Submit a usable estimate quickly.',
  },
  'lost-contact-reacquire': {
    name: 'Lost Contact / Reacquire',
    desc: 'Track a contact through a temporary sensor dropout and reacquisition.',
  },
};

export interface Props {
  onSelectDrill: (
    template: DrillTemplate,
    difficulty: DrillDifficulty,
    seed: string
  ) => void;
}

export function DrillLibrary({ onSelectDrill }: Props) {
  const templates = getDrillTemplateIds();
  const [selected, setSelected] = useState<DrillTemplate | null>(null);
  const [difficulty, setDifficulty] = useState<DrillDifficulty>('normal');

  return (
    <div className="drill-library">
      <h2 className="drill-library__title">Practice Drills</h2>
      <p className="drill-library__subtitle">
        Train on specific encounter types. Each drill is procedurally generated.
      </p>

      <div className="drill-library__grid">
        {templates.map((template) => {
          const info = TEMPLATE_LABELS[template];
          const isActive = selected === template;
          return (
            <button
              key={template}
              className={`drill-card ${isActive ? 'drill-card--active' : ''}`}
              onClick={() => setSelected(template)}
              type="button"
            >
              <h3 className="drill-card__name">{info.name}</h3>
              <p className="drill-card__desc">{info.desc}</p>
              {isActive && (
                <div className="drill-card__difficulty">
                  <label>
                    Difficulty:
                    <select
                      value={difficulty}
                      onChange={(e) =>
                        setDifficulty(e.target.value as DrillDifficulty)
                      }
                      onClick={(e) => e.stopPropagation()}
                    >
                      <option value="intro">Intro</option>
                      <option value="easy">Easy</option>
                      <option value="normal">Normal</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="drill-library__actions">
          <button
            className="drill-library__launch"
            onClick={() => {
              const seed = `drill-${Date.now()}`;
              onSelectDrill(selected, difficulty, seed);
            }}
            type="button"
          >
            Start Drill
          </button>
        </div>
      )}
    </div>
  );
}
