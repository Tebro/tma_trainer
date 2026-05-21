import { getAttemptHistory } from '../storage/progress';
import './AttemptHistory.css';

export function AttemptHistory() {
  const attempts = getAttemptHistory();

  if (attempts.length === 0) {
    return (
      <div className="attempt-history empty">
        <p>No attempts yet.</p>
        <p className="attempt-history__hint">
          Complete a lesson or drill to see your history here.
        </p>
      </div>
    );
  }

  // Sort by newest first
  const sorted = [...attempts].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="attempt-history">
      <h2 className="attempt-history__title">Attempt History</h2>

      <table className="attempt-history__table">
        <thead>
          <tr>
            <th>Date</th>
            <th>Scenario</th>
            <th>Score</th>
            <th>Estimates</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((a) => (
            <tr key={a.id}>
              <td>{formatDate(a.timestamp)}</td>
              <td>{a.lessonId}</td>
              <td>
                <span className={`score-badge ${getScoreClass(a.score)}`}>
                  {Math.round(a.score * 100)}%
                </span>
              </td>
              <td>{a.estimates}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
}

function getScoreClass(score: number): string {
  if (score >= 0.8) return 'score-great';
  if (score >= 0.6) return 'score-good';
  if (score >= 0.4) return 'score-okay';
  return 'score-needs-work';
}
