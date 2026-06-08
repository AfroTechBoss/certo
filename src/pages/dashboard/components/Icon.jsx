import React from 'react';

// Dashboard icon set. Add new ones by extending the `paths` map below.
//
// Usage: <Icon name="grid" size={20} c="var(--accent)" />
//
// Props:
//   name : key in the paths map (renders nothing if unknown)
//   size : px width+height (default 18)
//   c    : stroke colour (default 'currentColor')
//   sw   : stroke width (default 1.6)

export const Icon = ({ name, size = 18, c = 'currentColor', sw = 1.6 }) => {
  const p = { fill: 'none', stroke: c, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };
  const paths = {
    grid:    <><rect x="3" y="3" width="7" height="7" rx="1.5" {...p}/><rect x="14" y="3" width="7" height="7" rx="1.5" {...p}/><rect x="3" y="14" width="7" height="7" rx="1.5" {...p}/><rect x="14" y="14" width="7" height="7" rx="1.5" {...p}/></>,
    box:     <><path d="M21 8l-9-5-9 5 9 5 9-5z" {...p}/><path d="M3 8v8l9 5 9-5V8" {...p}/><path d="M12 13v8" {...p}/></>,
    tag:     <><path d="M20 13l-7 7-9-9V4h7l9 9z" {...p}/><circle cx="7.5" cy="7.5" r="1.2" fill={c} stroke="none"/></>,
    cert:    <><rect x="4" y="3" width="16" height="14" rx="2" {...p}/><path d="M8 8h8M8 12h5" {...p}/><circle cx="12" cy="19" r="2.5" {...p}/></>,
    mail:    <><rect x="3" y="5" width="18" height="14" rx="2" {...p}/><path d="M3 7l9 6 9-6" {...p}/></>,
    ticket:  <><path d="M3 8a2 2 0 012-2h14a2 2 0 012 2v2a2 2 0 000 4v2a2 2 0 01-2 2H5a2 2 0 01-2-2v-2a2 2 0 000-4V8z" {...p}/><path d="M13 6v12" {...p} strokeDasharray="2 2"/></>,
    chart:   <><path d="M3 3v18h18" {...p}/><path d="M7 14l3-3 3 2 4-5" {...p}/></>,
    pulse:   <><path d="M3 12h4l2 6 4-14 2 8h6" {...p}/></>,
    coins:   <><ellipse cx="12" cy="6" rx="8" ry="3" {...p}/><path d="M4 6v6c0 1.66 3.58 3 8 3s8-1.34 8-3V6" {...p}/><path d="M4 12v6c0 1.66 3.58 3 8 3s8-1.34 8-3v-6" {...p}/></>,
    users:   <><circle cx="9" cy="8" r="3.2" {...p}/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6" {...p}/><path d="M16 5.5a3.2 3.2 0 010 6M21 20c0-2.5-1.3-4.7-3.3-5.6" {...p}/></>,
    search:  <><circle cx="11" cy="11" r="7" {...p}/><path d="M21 21l-4-4" {...p}/></>,
    bell:    <><path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9z" {...p}/><path d="M13.7 21a2 2 0 01-3.4 0" {...p}/></>,
    logout:  <><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" {...p}/><path d="M16 17l5-5-5-5M21 12H9" {...p}/></>,
    refresh: <><path d="M21 12a9 9 0 11-3-6.7L21 8" {...p}/><path d="M21 3v5h-5" {...p}/></>,
    flag:    <><path d="M4 21V4M4 4h13l-2 4 2 4H4" {...p}/></>,
    plus:    <><path d="M12 5v14M5 12h14" {...p}/></>,
    chevron: <><path d="M9 6l6 6-6 6" {...p}/></>,
    book:    <><path d="M4 19.5A2.5 2.5 0 016.5 17H20" {...p}/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z" {...p}/></>,
    pen:     <><path d="M12 20h9" {...p}/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4 12.5-12.5z" {...p}/></>,
    undo:    <><path d="M3 7v6h6" {...p}/><path d="M3 13C5.33 9.33 8.6 7.5 12 7.5c4.42 0 7.5 2.5 9 7" {...p}/></>,
    upload:  <><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" {...p}/><polyline points="17 8 12 3 7 8" {...p}/><line x1="12" y1="3" x2="12" y2="15" {...p}/></>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24">{paths[name] || null}</svg>;
};
