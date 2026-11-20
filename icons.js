// Inline SVG icon set (24x24, stroke based). Usage: icon('flame', 20)
const P = (d) => `<path d="${d}"/>`;
const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;

const ICONS = {
  home: P('M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-6h-6v6H5a2 2 0 0 1-2-2z'),
  users: C(9, 8, 3.5) + P('M2.5 21v-1a6.5 6.5 0 0 1 13 0v1M16 4.7a3.5 3.5 0 0 1 0 6.6M18.5 14.3A6.5 6.5 0 0 1 21.5 20v1'),
  user: C(12, 8, 4) + P('M4 21a8 8 0 0 1 16 0'),
  bag: P('M5 8h14l-1 13H6zM9 8a3 3 0 0 1 6 0'),
  sword: P('M14.5 17.5L3 6V3h3l11.5 11.5M13 19l6-6M16 16l4 4M19 21l2-2'),
  chart: P('M3 3v18h18M7 15l4-4 3 3 5-6'),
  coin: C(12, 12, 9) + P('M12 6.5v11M9.2 9.3c0-1.3 1.2-2 2.8-2s2.8.7 2.8 2-1.2 1.7-2.8 2.2-2.8.9-2.8 2.2 1.2 2 2.8 2 2.8-.7 2.8-2'),
  bolt: P('M13 2L4 14h7l-1 8 9-12h-7z'),
  star: P('M12 2.5l2.9 6.2 6.6.8-4.9 4.6 1.3 6.7L12 17.5l-5.9 3.3 1.3-6.7L2.5 9.5l6.6-.8z'),
  flame: P('M12 2c.8 4 5 5.5 5 10.2a5 5 0 0 1-10 0c0-2 .8-3.3 2-4.4 0 2 .8 3 2 3.2C10.6 7.8 10.5 5 12 2z'),
  shield: P('M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z'),
  medal: C(12, 15, 6) + P('M8.5 3l3.5 6.5L15.5 3M12 12.5v5'),
  crown: P('M3 8l4.5 4L12 5l4.5 7L21 8l-2 11H5z'),
  arrowup: P('M12 20V5M5 12l7-7 7 7'),
  skull: P('M12 3a8 8 0 0 0-8 8c0 3 1.5 4.5 3 5.5V20h10v-3.5c1.5-1 3-2.5 3-5.5a8 8 0 0 0-8-8zM10 20v-2.5M14 20v-2.5') + C(9, 11.5, 1.2) + C(15, 11.5, 1.2),
  paw: C(5.5, 10.5, 1.8) + C(9.3, 5.8, 1.8) + C(14.7, 5.8, 1.8) + C(18.5, 10.5, 1.8) + P('M12 11.5c-3 0-5.5 3-5.5 5.7 0 2 1.5 2.5 3 2 .9-.3 1.5-.5 2.5-.5s1.6.2 2.5.5c1.5.5 3-.1 3-2 0-2.7-2.5-5.7-5.5-5.7z'),
  check: P('M5 12.5l4.5 4.5L19 7'),
  x: P('M6 6l12 12M18 6L6 18'),
  plus: P('M12 5v14M5 12h14'),
  clock: C(12, 12, 9) + P('M12 7v5l3 2'),
  camera: P('M3.5 8h3.2l1.8-2.5h7L17.3 8h3.2v12H3.5z') + C(12, 13.5, 3.5),
  file: P('M7 3h7l5 5v13H7zM14 3v5h5'),
  lock: P('M6 11h12v10H6zM8 11V8a4 4 0 0 1 8 0v3'),
  heart: P('M12 21s-8.5-5.4-8.5-11A4.7 4.7 0 0 1 12 7.6 4.7 4.7 0 0 1 20.5 10c0 5.6-8.5 11-8.5 11z'),
  spark: P('M12 3l2 6 6 3-6 3-2 6-2-6-6-3 6-3z'),
  book: P('M3 4.5h6a3 3 0 0 1 3 3v13a2.5 2.5 0 0 0-2.5-2H3zM21 4.5h-6a3 3 0 0 0-3 3v13a2.5 2.5 0 0 1 2.5-2H21z'),
  briefcase: P('M3 8h18v12H3zM8.5 8V5h7v3M3 13.5h18'),
  brush: P('M18.5 3.5l2 2-9 9-2-2zM9.5 13.5c-2.5 0-3.5 1.5-3.5 3.5 0 1.5-1 2.5-2.5 3 3 .8 7 .3 7-3.5'),
  search: C(11, 11, 6.5) + P('M20.5 20.5L16 16'),
  copy: P('M9 9h11v11H9zM5 15V4h11'),
  share: P('M4 13v7h16v-7M12 3v13M8 7l4-4 4 4'),
  settings: C(12, 12, 3) + P('M12 2.5v3M12 18.5v3M2.5 12h3M18.5 12h3M5.3 5.3l2.1 2.1M16.6 16.6l2.1 2.1M5.3 18.7l2.1-2.1M16.6 7.4l2.1-2.1'),
  logout: P('M9 4H5v16h4M15.5 8L20 12l-4.5 4M20 12H9'),
  trash: P('M4 7h16M9 7V4h6v3M6 7l1 14h10l1-14'),
  edit: P('M4 20h4L19.5 8.5l-4-4L4 16z'),
  gift: P('M4 11h16v10H4zM3 7.5h18V11H3zM12 7.5V21M12 7.5C10 3.5 6 4.5 7.5 7.5M12 7.5c2-4 6-3 4.5 0'),
  trophy: P('M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v2a3 3 0 0 0 3 3M17 6h3v2a3 3 0 0 1-3 3M12 14v4M8 21h8'),
  alert: C(12, 12, 9) + P('M12 7.5v5.5M12 16.5h.01'),
  refresh: P('M20 11a8 8 0 1 0-2.3 6M20 4v7h-7'),
  eye: P('M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z') + C(12, 12, 3),
  moon: P('M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5z'),
  target: C(12, 12, 9) + C(12, 12, 5) + C(12, 12, 1),
  upload: P('M12 16V4M7 9l5-5 5 5M4 20h16'),
  hourglass: P('M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9'),
  volume: P('M11 5L6 9H3v6h3l5 4zM15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13'),
  mute: P('M11 5L6 9H3v6h3l5 4zM16 9l5 6M21 9l-5 6'),
  send: P('M21 3L10 14M21 3l-7 18-4-7-7-4z'),
};

export function icon(name, size = 20, cls = '') {
  const body = ICONS[name] || ICONS.star;
  return `<svg class="ico ${cls}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}

export const TOPIC_ICON = {
  Health: 'heart', Mind: 'spark', Study: 'book', Work: 'briefcase',
  Home: 'home', Social: 'users', Creative: 'brush',
};
