import { useState, useCallback, type ReactNode } from 'react';
import './TabGroup.css';

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
}

interface TabGroupProps {
  tabs: Tab[];
  defaultTabId?: string;
  className?: string;
}

export function TabGroup({
  tabs,
  defaultTabId,
  className = '',
}: TabGroupProps) {
  const [activeId, setActiveId] = useState(defaultTabId ?? (tabs[0]?.id || ''));

  const handleClick = useCallback((id: string) => {
    setActiveId(id);
  }, []);

  const activeTab = tabs.find((t) => t.id === activeId);
  const baseCls = `tma-tabgroup${className ? ' ' + className : ''}`;

  return (
    <div className={baseCls}>
      <div className="tma-tabgroup__list" role="tablist">
        {tabs.map((tab) => {
          const isActive = tab.id === activeId;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`tma-tabgroup__tab${
                isActive ? ' tma-tabgroup__tab--active' : ''
              }`}
              onClick={() => handleClick(tab.id)}
            >
              {tab.label}
            </button>
          );
        })}
      </div>
      <div className="tma-tabgroup__panel" role="tabpanel">
        {activeTab?.content}
      </div>
    </div>
  );
}
