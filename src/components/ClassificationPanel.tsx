import { useState } from 'react';
import type { ContactCategory } from '../simulation/scenarioTypes';
import type { SonarCue } from '../simulation/sonarCues';
import { clarityLabel } from '../simulation/sonarCues';
import './ClassificationPanel.css';

const CATEGORIES: ContactCategory[] = [
  'merchant',
  'submarine',
  'surface-combatant',
  'biologic',
  'unknown',
];

interface Props {
  contactId: string;
  sonarCue: SonarCue | null;
  currentClassification?: ContactCategory;
  currentConfidence?: 'low' | 'medium' | 'high';
  onClassify: (data: {
    contactId: string;
    classification: ContactCategory;
    confidence: 'low' | 'medium' | 'high';
  }) => void;
}

export function ClassificationPanel({
  contactId,
  sonarCue,
  currentClassification,
  currentConfidence,
  onClassify,
}: Props) {
  const [category, setCategory] = useState<ContactCategory>(
    currentClassification ?? 'unknown'
  );
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>(
    currentConfidence ?? 'medium'
  );

  return (
    <div className="classification-panel">
      <h4 className="classification-panel__title">Classify {contactId}</h4>

      {sonarCue ? (
        <div className="sonar-cue">
          <div className="sonar-cue__header">
            <span className="sonar-cue__label">Sonar Signature</span>
            <span
              className={`sonar-cue__clarity sonar-cue__clarity--${sonarCue.clarity}`}
            >
              {clarityLabel(sonarCue.clarity)}
            </span>
          </div>
          <div className="sonar-cue__value">{sonarCue.signatureCategory}</div>
          {sonarCue.transientNote && (
            <div className="sonar-cue__transient">
              Transient: {sonarCue.transientNote}
            </div>
          )}
        </div>
      ) : (
        <p className="classification-panel__no-cue">
          No sonar cue available. Classify based on kinematics and experience.
        </p>
      )}

      <div className="classification-fields">
        <label className="classification-field">
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ContactCategory)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace(/-/g, ' ')}
              </option>
            ))}
          </select>
        </label>

        <label className="classification-field">
          <span>Confidence</span>
          <select
            value={confidence}
            onChange={(e) =>
              setConfidence(e.target.value as 'low' | 'medium' | 'high')
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <button
        className="classification-panel__submit"
        onClick={() =>
          onClassify({ contactId, classification: category, confidence })
        }
        type="button"
      >
        Record Classification
      </button>
    </div>
  );
}
