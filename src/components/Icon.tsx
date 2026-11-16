const PATHS = {
  home: '<path d="M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
  library: '<path d="M5 4v16M9 4v16M13 5l5 15M3 20h18"/>',
  pen: '<path d="M4 20l1-4L16 5l3 3L8 19z"/><path d="M14 7l3 3"/>',
  bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4z"/><path d="M10 21h4"/>',
  settings: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
  heart: '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>',
  star: '<path d="M12 3l2.7 5.6 6.1.8-4.5 4.2 1.1 6-5.4-3-5.4 3 1.1-6L3.2 9.4l6.1-.8z"/>',
  chat: '<path d="M4 5h16v11H9l-5 4z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.9l7.6-3.8M8.2 13.1l7.6 3.8"/>',
  download: '<path d="M12 4v11M7 11l5 5 5-5M4 20h16"/>',
  upload: '<path d="M12 20V9M7 13l5-5 5 5M4 4h16"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  filter: '<path d="M4 6h16M7 12h10M10 18h4"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4.5 6h.01M4.5 12h.01M4.5 18h.01"/>',
  grid: '<rect x="4" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5"/><rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5"/><rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5"/>',
  shelf: '<path d="M6 4v13M10 7v10M14 4v13M18 9v8M3 20h18"/>',
  moon: '<path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/>',
  music: '<path d="M9 18V5l11-2v13"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="17.5" cy="16" r="2.5"/>',
  sparkle: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>',
  drop: '<path d="M12 3c3.5 4.5 6 7.6 6 11a6 6 0 0 1-12 0c0-3.400 2.500-6.500 6-11z"/>',
  idcard: '<rect x="3" y="5" width="18" height="14" rx="2"/><circle cx="9" cy="11" r="2"/><path d="M6 16c.6-1.6 5.4-1.6 6 0M15 10h3M15 14h3"/>',
  at: '<circle cx="12" cy="12" r="4"/><path d="M16 8v5a2.5 2.5 0 0 0 5 0v-1a9 9 0 1 0-4 7.5"/>',
  dash: '<path d="M4 12h3M10.5 12h3M17 12h3"/>',
  sword: '<path d="M5 19l3-3M6 14l4 4M9 15L19 5V4h-1L8 14"/>',
  ghost: '<path d="M5 21V10a7 7 0 0 1 14 0v11l-2.500-2-2.300 2-2.200-2-2.200 2-2.300-2z"/><path d="M9.5 10h.01M14.5 10h.01"/>',
  rocket: '<path d="M12 3c4 2 6 6 6 10l-3 3H9l-3-3c0-4 2-8 6-10z"/><circle cx="12" cy="10" r="2"/><path d="M9 19l3 2 3-2"/>',
  calendar: '<rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/>',
  type: '<path d="M3 18l5-12 5 12M5 14h6M21 18v-5a3 3 0 0 0-6 0v2a3 3 0 0 0 6 0"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  ball: '<circle cx="12" cy="12" r="9"/><path d="M12 7l4 3-1.500 5h-5L8 10z"/>',
  smile: '<circle cx="12" cy="12" r="9"/><path d="M8.500 14c1 1.500 6 1.500 7 0M9 9.500h.01M15 9.500h.01"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1"/><path d="M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1"/>',
  minus: '<path d="M5 12h14"/>',
  alignleft: '<path d="M4 6h16M4 10h10M4 14h16M4 18h10"/>',
  aligncenter: '<path d="M4 6h16M7 10h10M4 14h16M7 18h10"/>',
  alignright: '<path d="M4 6h16M10 10h10M4 14h16M10 18h10"/>',
  alignjustify: '<path d="M4 6h16M4 10h16M4 14h16M4 18h16"/>',
  undo: '<path d="M8 14L4 10l4-4"/><path d="M4 10h10a5 5 0 0 1 0 10h-3"/>',
  redo: '<path d="M16 14l4-4-4-4"/><path d="M20 10H10a5 5 0 0 0 0 10h3"/>',
  up: '<path d="M12 19V5M6 11l6-6 6 6"/>',
  down: '<path d="M12 5v14M6 13l6 6 6-6"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v6M14 11v6"/>',
  chevron: '<path d="M6 9l6 6 6-6"/>',
  alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7.500v5.500M12 16.500h.01"/>',
} as const;

export type IconName = keyof typeof PATHS;

// pathLength="1" deja cada trazo con largo 1: así una animación puede dibujarlo de 0 a 1
// sin medir nada (ver "animaciones de íconos" en globals.css).
const DRAWABLE = Object.fromEntries(
  Object.entries(PATHS).map(([name, svg]) => [name, svg.replace(/<(path|circle|rect)\b/g, '<$1 pathLength="1"')]),
) as Record<IconName, string>;

export function Icon({ name, size = 20, stroke = 1.8 }: { name: IconName; size?: number; stroke?: number }) {
  return (
    <svg
      aria-hidden="true" className="icon" data-icon={name} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" style={{ flex: "none" }}
      dangerouslySetInnerHTML={{ __html: DRAWABLE[name] }}
    />
  );
}
