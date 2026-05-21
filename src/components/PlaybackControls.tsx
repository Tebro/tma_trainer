import './PlaybackControls.css';

interface Props {
  elapsedSec: number;
  durationSec: number;
  isPlaying: boolean;
  speed: number;
  onPlay: () => void;
  onPause: () => void;
  onStep: (deltaSec: number) => void;
  onSeek: (timeSec: number) => void;
  onReset: () => void;
  onSetSpeed: (speed: 0.25 | 0.5 | 1 | 2 | 4 | 8) => void;
  timelineStepSec?: number;
}

export function PlaybackControls({
  elapsedSec,
  durationSec,
  isPlaying,
  speed,
  onPlay,
  onPause,
  onStep,
  onSeek,
  onReset,
  onSetSpeed,
  timelineStepSec = 1,
}: Props) {
  const progress = durationSec > 0 ? elapsedSec / durationSec : 0;
  const clampedProgress = Math.min(1, Math.max(0, progress));

  return (
    <div className="playback-controls">
      <div className="playback-controls__time">
        <span className="playback-controls__clock">
          {formatTime(elapsedSec)}
        </span>
        <span className="playback-controls__duration">
          / {formatTime(durationSec)}
        </span>
      </div>

      <div className="playback-controls__buttons">
        <button onClick={onReset} type="button">
          Reset
        </button>
        <button onClick={() => onStep(20)} type="button">
          Step 20s
        </button>
        <button
          onClick={isPlaying ? onPause : onPlay}
          type="button"
          className={isPlaying ? 'active' : ''}
        >
          {isPlaying ? 'Pause' : 'Play'}
        </button>
      </div>

      <div className="playback-controls__speed">
        <span>Speed:</span>
        {[1, 2, 4, 8].map((s) => (
          <button
            key={s}
            className={speed === s ? 'active' : ''}
            onClick={() => onSetSpeed(s as 1 | 2 | 4 | 8)}
            type="button"
          >
            {s}x
          </button>
        ))}
      </div>

      <label className="playback-controls__timeline">
        <span className="playback-controls__timeline-label">Timeline</span>
        <input
          aria-label="Timeline"
          className="playback-controls__range"
          type="range"
          min={0}
          max={durationSec}
          step={timelineStepSec}
          value={Math.min(durationSec, Math.max(0, elapsedSec))}
          onChange={(event) => onSeek(Number(event.target.value))}
        />
      </label>

      <div className="playback-controls__bar" aria-hidden="true">
        <div
          className="playback-controls__progress"
          style={{ width: `${clampedProgress * 100}%` }}
        />
      </div>
    </div>
  );
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}
