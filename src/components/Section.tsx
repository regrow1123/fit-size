import { useState, type ReactNode } from 'react';

/** Numbered section card with header */
export function Section({
  num,
  title,
  tag,
  tagColor = 'blue',
  desc,
  collapsible,
  defaultOpen = true,
  children,
}: {
  num: number;
  title: string;
  tag?: string;
  tagColor?: 'blue' | 'gray' | 'green';
  desc?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const tagColors = {
    blue: 'bg-blue-100 text-blue-700',
    gray: 'bg-gray-100 text-gray-500',
    green: 'bg-green-100 text-green-700',
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
      <div
        className={`flex items-center gap-3 px-4 py-3 bg-gray-50 border-b border-gray-200 ${collapsible ? 'cursor-pointer hover:bg-gray-100 transition' : ''}`}
        onClick={collapsible ? () => setOpen(!open) : undefined}
      >
        <span className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white text-sm font-bold flex items-center justify-center">
          {num}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-gray-800">{title}</h3>
            {tag && (
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${tagColors[tagColor]}`}>
                {tag}
              </span>
            )}
          </div>
          {desc && <p className="text-xs text-gray-400 mt-0.5">{desc}</p>}
        </div>
        {collapsible && (
          <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
        )}
      </div>
      {(!collapsible || open) && (
        <div className="px-3 py-3 space-y-3">
          {children}
        </div>
      )}
    </div>
  );
}

/** Sub-section: divider + inline label, no extra padding */
export function SubSection({
  num,
  title,
  desc,
  children,
}: {
  num: string;
  title: string;
  desc?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 pt-1">
        <span className="text-xs font-bold text-blue-500">{num}</span>
        <span className="text-xs font-bold text-gray-700">{title}</span>
        <div className="flex-1 border-t border-gray-200" />
      </div>
      {desc && <p className="text-[11px] text-gray-400 -mt-1">{desc}</p>}
      {children}
    </div>
  );
}
