import type { ReactNode } from 'react';
import './Panel.css';

interface PanelProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Panel({ title, children, className = '' }: PanelProps) {
  const cls = `tma-panel${className ? ' ' + className : ''}`;
  return (
    <div className={cls}>
      {title != null && title !== '' && (
        <h2 className="tma-panel__title">{title}</h2>
      )}
      <div className="tma-panel__content">{children}</div>
    </div>
  );
}
