const PATHS: Record<string, string> = {
  ball: `<circle cx="12" cy="12" r="9"/><path d="m12 8.2 3.2 2.3-1.2 3.7h-4L8.8 10.5 12 8.2Z"/><path d="M12 3v5.2M4.4 9.3l4.4 1.2M6.6 19.1l3-4.9M17.4 19.1l-3-4.9M19.6 9.3l-4.4 1.2"/>`,
  code: `<path d="m8 7.5-5 4.5 5 4.5"/><path d="m16 7.5 5 4.5-5 4.5"/>`,
  music: `<path d="M9 18V6l10-2v12"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="16" r="2"/>`,
  heart: `<path d="M19.5 5.5a5 5 0 0 0-7.1 0L12 5.9l-.4-.4a5 5 0 1 0-7.1 7.1l7.5 7.5 7.5-7.5a5 5 0 0 0 0-7.1Z"/>`,
  trophy: `<path d="M8 21h8M12 17v4"/><path d="M7 4h10v5a5 5 0 0 1-10 0V4Z"/><path d="M7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11"/>`,
  briefcase: `<rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18"/>`,
  users: `<circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><circle cx="17.5" cy="9.5" r="2.5"/><path d="M16.5 14.2a4.5 4.5 0 0 1 4 4.3"/>`,
  monitor: `<rect x="2.5" y="4" width="19" height="12.5" rx="2"/><path d="M8.5 20.5h7M12 16.5v4"/>`,
  book: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20V4H6.5A2.5 2.5 0 0 0 4 6.5v13Z"/><path d="M4 19.5A2.5 2.5 0 0 0 6.5 22H20v-5"/>`,
  tree: `<path d="M12 21v-5"/><path d="m12 3 5.5 7H14l4 6H6l4-6H6.5L12 3Z"/>`,
  pin: `<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.6"/>`,
  spark: `<path d="M12 3l2.2 6.3L21 12l-6.8 2.7L12 21l-2.2-6.3L3 12l6.8-2.7L12 3Z"/>`,
  calendar: `<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M16 3v4M8 3v4M3 10h18"/>`,
  clock: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>`,
  arrowUpRight: `<path d="M7 17 17 7M8 7h9v9"/>`,
  check: `<path d="m5 13 4 4L19 7"/>`,
};

export function iconSvg(name: string, size = 18, strokeWidth = 2): string {
  const path = PATHS[name] ?? PATHS.pin;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

export function hasIcon(name: string): boolean {
  return name in PATHS;
}
