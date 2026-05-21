import { useState } from 'react';
import type {
  ContactCategory,
  Estimate,
  EstimateConfidence,
} from '../simulation/scenarioTypes';
import type { SonarCue } from '../simulation/sonarCues';
import { clarityLabel } from '../simulation/sonarCues';
import './EstimateForm.css';

const CONTACT_CATEGORIES: ContactCategory[] = [
  'merchant',
  'submarine',
  'surface-combatant',
  'biologic',
  'unknown',
];

interface Props {
  contactId: string;
  contactOptions?: { id: string; label: string }[];
  showClassification?: boolean;
  sonarCue?: SonarCue | null;
  suggestedRangeYds?: number | null;
  timestampSec?: number;
  previousEstimates?: Estimate[];
  onSubmit: (estimate: Estimate) => void;
  onChangeContact?: (id: string) => void;
}

export function EstimateForm({
  contactId,
  contactOptions,
  showClassification = false,
  sonarCue,
  suggestedRangeYds,
  timestampSec,
  previousEstimates = [],
  onSubmit,
  onChangeContact,
}: Props) {
  const [range, setRange] = useState('');
  const [course, setCourse] = useState('');
  const [speed, setSpeed] = useState('');
  const [classification, setClassification] =
    useState<ContactCategory>('unknown');
  const [confidence, setConfidence] = useState<EstimateConfidence>('medium');
  const [errors, setErrors] = useState<string[]>([]);

  function validate(): boolean {
    const e: string[] = [];
    const r = parseFloat(range);
    const c = parseFloat(course);
    const s = parseFloat(speed);

    if (Number.isNaN(r) || r <= 0) e.push('Range must be a positive number');
    if (Number.isNaN(c) || c < 0 || c >= 360) e.push('Course must be 0–360');
    if (Number.isNaN(s) || s < 0) e.push('Speed must be non-negative');

    setErrors(e);
    return e.length === 0;
  }

  function handleSubmit() {
    if (!validate()) return;

    const estimate: Estimate = {
      timestampSec: timestampSec ?? Date.now() / 1000,
      contactId,
      rangeYds: parseFloat(range),
      course: parseFloat(course),
      speed: parseFloat(speed),
      classification: showClassification ? classification : undefined,
      confidence,
    };

    onSubmit(estimate);

    setRange('');
    setCourse('');
    setSpeed('');
    setClassification('unknown');
    setErrors([]);
  }

  return (
    <div className="estimate-form">
      <h4 className="estimate-form__title">Submit Estimate for {contactId}</h4>

      {errors.length > 0 && (
        <ul className="estimate-form__errors">
          {errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      )}

      {/* Contact selector for multi-contact scenarios */}
      {contactOptions && contactOptions.length > 1 && (
        <div className="estimate-form__contact-selector">
          <label className="estimate-form__field">
            <span>Contact</span>
            <select
              value={contactId}
              onChange={(e) => onChangeContact?.(e.target.value)}
            >
              {contactOptions.map((opt) => (
                <option key={opt.id} value={opt.id}>
                  {opt.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {suggestedRangeYds && (
        <div className="estimate-form__suggestion">
          <span>Plot cursor range: {Math.round(suggestedRangeYds)} yd</span>
          <button
            type="button"
            onClick={() => setRange(String(Math.round(suggestedRangeYds)))}
          >
            Use Range
          </button>
        </div>
      )}

      {/* Sonar cue display */}
      {showClassification && sonarCue && (
        <div className="estimate-form__sonar-cue">
          <div className="sonar-cue-header">
            <span className="sonar-cue-label">Sonar Signature</span>
            <span className={`sonar-cue-clarity clarity-${sonarCue.clarity}`}>
              {clarityLabel(sonarCue.clarity)}
            </span>
          </div>
          <div className="sonar-cue-value">{sonarCue.signatureCategory}</div>
          {sonarCue.transientNote && (
            <div className="sonar-cue-transient">
              Note: {sonarCue.transientNote}
            </div>
          )}
        </div>
      )}

      <div className="estimate-form__grid">
        <label className="estimate-form__field">
          <span>Range (yds)</span>
          <input
            type="number"
            value={range}
            onChange={(e) => setRange(e.target.value)}
            min={1}
          />
        </label>

        <label className="estimate-form__field">
          <span>Course (deg)</span>
          <input
            type="number"
            value={course}
            onChange={(e) => setCourse(e.target.value)}
            min={0}
            max={360}
          />
        </label>

        <label className="estimate-form__field">
          <span>Speed (kts)</span>
          <input
            type="number"
            value={speed}
            onChange={(e) => setSpeed(e.target.value)}
            min={0}
          />
        </label>

        {/* Classification selector */}
        {showClassification && (
          <label className="estimate-form__field">
            <span>Classification</span>
            <select
              value={classification}
              onChange={(e) =>
                setClassification(e.target.value as ContactCategory)
              }
            >
              {CONTACT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c.replace(/-/g, ' ')}
                </option>
              ))}
            </select>
          </label>
        )}

        <label className="estimate-form__field">
          <span>Confidence</span>
          <select
            value={confidence}
            onChange={(e) =>
              setConfidence(e.target.value as EstimateConfidence)
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </label>
      </div>

      <button
        className="estimate-form__submit"
        onClick={handleSubmit}
        type="button"
      >
        Submit Estimate
      </button>

      {previousEstimates.length > 0 && (
        <div className="estimate-form__history">
          <h5>Previous Estimates</h5>
          <ul>
            {previousEstimates.map((e, i) => (
              <li key={i}>
                #{i + 1}: R={Math.round(e.rangeYds)}yd, C={Math.round(e.course)}
                °, S={e.speed}kt {e.classification && `[${e.classification}] `}(
                {e.confidence})
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
