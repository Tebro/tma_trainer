import { useState } from 'react';
import type { Observation } from '../simulation/scenarioTypes';
import './ContactPanel.css';

interface Props {
  observations: Observation[];
  currentTimeSec?: number;
  updateIntervalSec?: number;
}

const STALE_MULTIPLIER = 3;

export function ContactPanel({
  observations,
  currentTimeSec = 0,
  updateIntervalSec = 20,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const byContact = groupByContact(observations);

  if (Object.keys(byContact).length === 0) {
    return (
      <div className="contact-panel">
        <h3 className="contact-panel__title">Contacts</h3>
        <div className="contact-panel__empty">
          <p>No contacts detected</p>
          <p className="contact-panel__empty-hint">
            Start playback or step forward to detect contacts.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-panel">
      <h3 className="contact-panel__title">Contacts</h3>

      {Object.entries(byContact).map(([id, obsList]) => {
        const latest = obsList[obsList.length - 1];
        const age = currentTimeSec - latest.timestampSec;
        const isStale = age > updateIntervalSec * STALE_MULTIPLIER;
        const timeSince = formatAge(age);

        return (
          <div key={id}>
            <button
              className={`contact-card ${
                selectedId === id ? 'contact-card--selected' : ''
              } ${isStale ? 'contact-card--stale' : ''}`}
              onClick={() => setSelectedId((prev) => (prev === id ? null : id))}
              type="button"
            >
              <div className="contact-card__header">
                <span className="contact-card__id">{id}</span>
                <span
                  className={`contact-card__confidence contact-card__confidence--${latest.confidence}`}
                >
                  {latest.confidence}
                </span>
              </div>
              <div className="contact-card__primary">
                <span className="contact-card__bearing">
                  {latest.bearingDeg.toFixed(1)}°
                </span>
                {latest.signalCue && (
                  <span className="contact-card__signal">
                    {latest.signalCue}
                  </span>
                )}
              </div>
              <div className="contact-card__meta">
                <span>Obs: {obsList.length}</span>
                <span className={isStale ? 'stale-age' : 'fresh-age'}>
                  {timeSince}
                </span>
              </div>
            </button>

            {selectedId === id && (
              <div className="contact-detail">
                <div className="contact-detail__row">
                  <span>Bearing history</span>
                  <span>{obsList.length} observations</span>
                </div>
                <div className="contact-detail__row">
                  <span>Latest bearing</span>
                  <span>{latest.bearingDeg.toFixed(2)}°</span>
                </div>
                {latest.signalCue && (
                  <div className="contact-detail__row">
                    <span>Signal cue</span>
                    <span>{latest.signalCue}</span>
                  </div>
                )}
                <div className="contact-detail__row">
                  <span>Confidence</span>
                  <span className={`cap-${latest.confidence}`}>
                    {latest.confidence}
                  </span>
                </div>
                <div className="contact-detail__row">
                  <span>Source</span>
                  <span>{latest.source}</span>
                </div>
                <div className="contact-detail__row">
                  <span>Last seen</span>
                  <span>T+{formatTime(latest.timestampSec)}</span>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function groupByContact(
  observations: Observation[]
): Record<string, Observation[]> {
  const groups: Record<string, Observation[]> = {};
  for (const obs of observations) {
    if (!groups[obs.contactId]) groups[obs.contactId] = [];
    groups[obs.contactId].push(obs);
  }
  for (const id in groups) {
    groups[id].sort((a, b) => a.timestampSec - b.timestampSec);
  }
  return groups;
}

function formatAge(sec: number): string {
  if (sec < 1) return 'now';
  if (sec < 60) return `${Math.floor(sec)}s ago`;
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}m ${s}s`;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
