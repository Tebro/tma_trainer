import type { Debrief } from '../simulation/scenarioTypes';
import './DebriefView.css';

interface Props {
  debrief: Debrief;
  onRetry?: () => void;
  onNextLesson?: () => void;
}

export function DebriefView({ debrief, onRetry, onNextLesson }: Props) {
  const pct = Math.round(debrief.scoreTotal * 100);
  const grade =
    pct >= 90
      ? 'Excellent'
      : pct >= 70
        ? 'Good'
        : pct >= 50
          ? 'Fair'
          : 'Needs Practice';

  return (
    <div className="debrief-view">
      <h2 className="debrief-view__title">Debrief</h2>

      <div className="debrief-view__score">
        <div className="debrief-view__score-circle">
          <span className="debrief-view__score-value">{pct}%</span>
          <span className="debrief-view__score-label">{grade}</span>
        </div>
      </div>

      <div className="debrief-view__breakdown">
        <h3>Score Breakdown</h3>
        {debrief.scoreComponents.length === 0 ? (
          <p>No estimates were submitted.</p>
        ) : (
          <ul>
            {debrief.scoreComponents.map((comp) => (
              <li key={comp.metric} className="debrief-view__metric">
                <span className="debrief-view__metric-name">{comp.metric}</span>
                <span className="debrief-view__metric-bar">
                  <span
                    className="debrief-view__metric-fill"
                    style={{ width: `${comp.value * 100}%` }}
                  />
                </span>
                <span className="debrief-view__metric-value">
                  {Math.round(comp.value * 100)}%
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="debrief-view__explanation">
        <h3>What This Means</h3>
        {debrief.scenarioId.includes('bearing-only-ambiguity') ? (
          <p>
            This scenario is intentionally under-constrained. A low range score
            does not mean you missed an obvious calculation: passive bearings
            reveal direction, while range, course, and speed remain hypotheses
            until more observations or an ownship maneuver improve the geometry.
          </p>
        ) : (
          <p>
            Compare your estimate markers on the plot with the revealed truth.
            Large range errors usually mean the observed bearing history still
            allowed multiple plausible contact tracks.
          </p>
        )}
      </div>

      {debrief.estimates.length > 0 && (
        <div className="debrief-view__estimates">
          <h3>Your Submitted Hypotheses</h3>
          {debrief.estimates.map((estimate, index) => (
            <div
              key={`${estimate.contactId}-${index}`}
              className="estimate-card"
            >
              <div className="estimate-card__id">
                {estimate.contactId} estimate {index + 1}
              </div>
              <div className="estimate-card__details">
                Range {Math.round(estimate.rangeYds).toLocaleString()} yd |
                Course {Math.round(estimate.course)}° | Speed {estimate.speed}{' '}
                kt | Confidence {estimate.confidence}
                {estimate.classification
                  ? ` | Classification ${estimate.classification}`
                  : ''}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="debrief-view__feedback">
        <h3>Feedback</h3>
        {debrief.feedback.length === 0 ? (
          <p>No feedback.</p>
        ) : (
          <ul>
            {debrief.feedback.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        )}
      </div>

      {/* Truth reveal */}
      <div className="debrief-view__truth">
        <h3>Truth Reveal</h3>
        {Object.entries(debrief.truthAtTime).map(([id, contact]) => (
          <TruthCard key={id} contactId={id} truth={contact} />
        ))}
      </div>

      <div className="debrief-view__actions">
        {onRetry && (
          <button className="debrief-view__btn" onClick={onRetry} type="button">
            Retry Lesson
          </button>
        )}
        {onNextLesson && (
          <button
            className="debrief-view__btn"
            onClick={onNextLesson}
            type="button"
          >
            Next Lesson
          </button>
        )}
      </div>
    </div>
  );
}

function TruthCard({
  contactId,
  truth,
}: {
  contactId: string;
  truth: { position: { x: number; y: number }; course: number; speed: number };
}) {
  return (
    <div className="truth-card">
      <div className="truth-card__id">{contactId}</div>
      <div className="truth-card__details">
        <div>
          Position: ({truth.position.x.toFixed(0)},{' '}
          {truth.position.y.toFixed(0)})
        </div>
        <div>Course: {truth.course.toFixed(1)}°</div>
        <div>Speed: {truth.speed.toFixed(1)} kts</div>
      </div>
    </div>
  );
}
