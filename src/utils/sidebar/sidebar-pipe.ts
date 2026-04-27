/**
 * Drip-irrigation pipe overlay for the active chapter's section list.
 *
 * Builds an SVG of a transparent glass pipe descending alongside the
 * section rows, with a horizontal feeder tube branching off into each
 * section EXCEPT the last — the last receives the bottom curve of the
 * vertical pipe instead. Blue water (centered around #38BDF8) flows
 * through the pipe as a single continuous stream.
 *
 * Geometry is computed from the actual <li> offsetTop of each row at
 * render time, so the pipe stays aligned even if row heights or gaps
 * are tweaked in CSS (the active-chapter rule pins them to 36px, but
 * the SVG doesn't depend on that constant being exact).
 *
 * Flow continuity:
 *   The vertical pipe + bottom curve + horizontal entry into the last
 *   row are a SINGLE SVG <path> with one stroke-dashoffset animation,
 *   so water flows seamlessly top → down → curve → into last section
 *   with no break or reset at the bend. Side feeders (rows 0..N-2)
 *   keep a separate horizontal flow per branch.
 *
 * The overlay is purely decorative: pointer-events: none and aria-
 * hidden. The SVG sits absolutely inside `.usb-sections` (which is
 * position: relative) and does not affect document layout.
 */

const SVG_NS = 'http://www.w3.org/2000/svg';

const FEEDER_HEIGHT = 3;
const CURVE_RADIUS = 20.5;
const PIPE_LEFT_X = 21.5;
const PIPE_RIGHT_X = 26.5;
const PIPE_CENTER_X = 24;
const SVG_WIDTH = 32;
const FEEDER_END_X = PIPE_LEFT_X;
const CURVE_INNER_X = 6;

/* Water colors — sky palette centered on #38BDF8 (per design spec).
   Edges darker for depth, center bright cyan for the highlight. */
const WATER_STOPS: Array<[string, string, string]> = [
  ['0%', '#0369A1', '0.85'],
  ['30%', '#0EA5E9', '0.95'],
  ['50%', '#38BDF8', '1'],
  ['70%', '#0EA5E9', '0.95'],
  ['100%', '#0369A1', '0.85'],
];

/* Glass tube wall — neutral so it reads as transparent, not tinted.
   Slight asymmetry across the gradient simulates a curved surface
   catching light from one side. */
const GLASS_STOPS: Array<[string, string, string]> = [
  ['0%', '#5b6470', '0.55'],
  ['20%', '#8aa5c0', '0.18'],
  ['50%', '#ffffff', '0.10'],
  ['80%', '#8aa5c0', '0.18'],
  ['100%', '#5b6470', '0.55'],
];

const FEEDER_GLASS_STOPS: Array<[string, string, string]> = [
  ['0%', '#ffffff', '0.18'],
  ['50%', '#ffffff', '0.05'],
  ['100%', '#ffffff', '0.18'],
];

const PIPE_OUTLINE = '#0c1a2e';

function svg(tag: string, attrs: Record<string, string | number>): SVGElement {
  const node = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  return node;
}

function appendStops(
  parent: SVGElement,
  stops: Array<[string, string, string]>,
): void {
  for (const [offset, color, opacity] of stops) {
    parent.appendChild(svg('stop', {
      offset,
      'stop-color': color,
      'stop-opacity': opacity,
    }));
  }
}

interface PipeGeometry {
  rowCenters: number[];
  lastRowCenterY: number;
  verticalPipeEndY: number;
  /** Bottom edge of the horizontal extension wall (lastRow + FEEDER_HEIGHT/2). */
  wallBottomY: number;
  /** Top edge of the horizontal extension wall (lastRow - FEEDER_HEIGHT/2). */
  wallTopY: number;
  svgHeight: number;
}

function buildDefs(geo: PipeGeometry): SVGElement {
  const defs = svg('defs', {});

  const wall = svg('linearGradient', {
    id: 'usbPipeWall', x1: '0%', y1: '0%', x2: '100%', y2: '0%',
  });
  appendStops(wall, GLASS_STOPS);
  defs.appendChild(wall);

  const feederGlass = svg('linearGradient', {
    id: 'usbPipeFeederGlass', x1: '0%', y1: '0%', x2: '0%', y2: '100%',
  });
  appendStops(feederGlass, FEEDER_GLASS_STOPS);
  defs.appendChild(feederGlass);

  const water = svg('linearGradient', {
    id: 'usbPipeWater', x1: '0%', y1: '0%', x2: '100%', y2: '0%',
  });
  appendStops(water, WATER_STOPS);
  defs.appendChild(water);

  /* Horizontal stream pattern for the side feeders — single thin
     sine wave at 10×3 (period × feeder height). The main pipe
     (vertical + curve + last-row entry) does NOT use this pattern;
     it uses a single continuous stroke-dashoffset animation
     instead, which is why the flow stays seamless across the bend. */
  const flowH = svg('pattern', {
    id: 'usbPipeFlowHoriz', x: 0, y: 0, width: 10, height: 3,
    patternUnits: 'userSpaceOnUse',
  });
  flowH.appendChild(svg('rect', { width: 10, height: 3, fill: 'transparent' }));
  flowH.appendChild(svg('path', {
    d: 'M 0 1.5 Q 2.5 0 5 1.5 Q 7.5 3 10 1.5',
    stroke: '#BAE6FD', 'stroke-width': '0.4', fill: 'none', opacity: '0.7',
  }));
  defs.appendChild(flowH);

  /* Clip for the entire main pipe interior: vertical pipe → curve →
     horizontal extension to x=0 (last-row entry). Water bodies +
     animated flow stroke are all clipped to this single shape. */
  const vertClip = svg('clipPath', { id: 'usbPipeVertClip' });
  vertClip.appendChild(svg('path', {
    d: [
      `M ${PIPE_LEFT_X} 0`,
      `L ${PIPE_RIGHT_X} 0`,
      `L ${PIPE_RIGHT_X} ${geo.verticalPipeEndY}`,
      `Q ${PIPE_RIGHT_X} ${geo.wallBottomY} ${CURVE_INNER_X} ${geo.wallBottomY}`,
      `L 0 ${geo.wallBottomY}`,
      `L 0 ${geo.wallTopY}`,
      `L ${CURVE_INNER_X} ${geo.wallTopY}`,
      `Q ${PIPE_LEFT_X} ${geo.wallTopY} ${PIPE_LEFT_X} ${geo.verticalPipeEndY}`,
      'Z',
    ].join(' '),
  }));
  defs.appendChild(vertClip);

  /* One clip per side feeder — keeps the animated overlay rect
     from spilling above/below the feeder's vertical band. */
  for (let i = 0; i < geo.rowCenters.length - 1; i++) {
    const feederTopY = geo.rowCenters[i] - FEEDER_HEIGHT / 2;
    const fc = svg('clipPath', { id: `usbPipeFeeder${i}Clip` });
    fc.appendChild(svg('rect', {
      x: 0, y: feederTopY, width: FEEDER_END_X, height: FEEDER_HEIGHT,
    }));
    defs.appendChild(fc);
  }

  return defs;
}

function buildMainPipe(root: SVGElement, geo: PipeGeometry): void {
  const { verticalPipeEndY, lastRowCenterY, wallTopY, wallBottomY } = geo;

  /* Subtle outer glow behind the glass — gives the pipe a halo
     against the sidebar surface without overwhelming the rows. */
  root.appendChild(svg('rect', {
    x: 20.5, y: 0, width: 7, height: verticalPipeEndY,
    fill: '#38BDF8', opacity: '0.05',
  }));

  /* All water + flow layers live inside this group, clipped to the
     full main pipe shape (vertical + curve + extension). */
  const interior = svg('g', { 'clip-path': 'url(#usbPipeVertClip)' });

  /* Static water body — a single rect that covers the vertical
     pipe, the curve area, and the horizontal extension. The clip
     path masks it to the actual pipe interior shape. */
  interior.appendChild(svg('rect', {
    x: 0, y: 0,
    width: PIPE_RIGHT_X,
    height: wallBottomY + 1,
    fill: 'url(#usbPipeWater)',
  }));

  /* Single continuous flow stroke — THE key animation. One <path>
     traces the centerline from the top of the vertical pipe, down,
     around the curve, and into the last row's extension. Dashed
     stroke + animated stroke-dashoffset gives a smooth water-flow
     illusion that passes through the bend without resetting. The
     stroke is wider than the pipe interior in places (e.g. 4 in a
     3-tall horizontal segment) — the parent clip masks it to the
     actual interior shape so it never bleeds. */
  interior.appendChild(svg('path', {
    'class': 'usb-pipe-flow',
    d: [
      `M ${PIPE_CENTER_X} 0`,
      `L ${PIPE_CENTER_X} ${verticalPipeEndY}`,
      `Q ${PIPE_CENTER_X} ${lastRowCenterY} ${CURVE_INNER_X} ${lastRowCenterY}`,
      `L 0 ${lastRowCenterY}`,
    ].join(' '),
    stroke: '#BAE6FD',
    'stroke-width': '4',
    'stroke-linecap': 'round',
    fill: 'none',
    opacity: '0.55',
    'stroke-dasharray': '8 14',
  }));

  /* Bubbles distributed along the vertical run with staggered
     start delays. Their cy positions scale with the run length so
     visual density adapts to chapter size. Sit above the flow
     stroke (z-order) so they read as gentle motion in the water. */
  const bubbles: Array<[number, number, number, number]> = [
    [23.5, verticalPipeEndY * 0.85, 0.8, 0],
    [24.5, verticalPipeEndY * 0.6,  0.6, 0.8],
    [23.8, verticalPipeEndY * 0.4,  0.7, 1.6],
    [24.2, verticalPipeEndY * 0.2,  0.5, 2.2],
  ];
  for (const [cx, cy, r, delay] of bubbles) {
    interior.appendChild(svg('circle', {
      'class': 'usb-pipe-bubble',
      cx, cy, r,
      fill: '#E0F2FE', opacity: '0',
      style: `animation-delay: ${delay}s;`,
    }));
  }

  root.appendChild(interior);

  /* Glass walls of the vertical pipe (on top of water). */
  root.appendChild(svg('rect', {
    x: PIPE_LEFT_X, y: 0,
    width: PIPE_RIGHT_X - PIPE_LEFT_X, height: verticalPipeEndY,
    fill: 'url(#usbPipeWall)',
  }));
  root.appendChild(svg('line', {
    x1: PIPE_CENTER_X, y1: 0, x2: PIPE_CENTER_X, y2: verticalPipeEndY,
    stroke: '#ffffff', 'stroke-width': '0.3', opacity: '0.35',
  }));
  root.appendChild(svg('line', {
    x1: PIPE_LEFT_X, y1: 0, x2: PIPE_LEFT_X, y2: verticalPipeEndY,
    stroke: PIPE_OUTLINE, 'stroke-width': '0.4', opacity: '0.55',
  }));
  root.appendChild(svg('line', {
    x1: PIPE_RIGHT_X, y1: 0, x2: PIPE_RIGHT_X, y2: verticalPipeEndY,
    stroke: PIPE_OUTLINE, 'stroke-width': '0.4', opacity: '0.55',
  }));

  /* Curve walls — a closed shape filled with glass gradient so the
     curve area is visibly tinted glass over the water beneath. */
  root.appendChild(svg('path', {
    d: [
      `M ${PIPE_LEFT_X} ${verticalPipeEndY}`,
      `Q ${PIPE_LEFT_X} ${wallTopY} ${CURVE_INNER_X} ${wallTopY}`,
      `L ${CURVE_INNER_X} ${wallBottomY}`,
      `Q ${PIPE_RIGHT_X} ${wallBottomY} ${PIPE_RIGHT_X} ${verticalPipeEndY}`,
      'Z',
    ].join(' '),
    fill: 'url(#usbPipeWall)',
  }));
  root.appendChild(svg('path', {
    d: `M ${PIPE_LEFT_X} ${verticalPipeEndY} Q ${PIPE_LEFT_X} ${wallTopY} ${CURVE_INNER_X} ${wallTopY}`,
    stroke: PIPE_OUTLINE, 'stroke-width': '0.4', fill: 'none', opacity: '0.55',
  }));
  root.appendChild(svg('path', {
    d: `M ${PIPE_RIGHT_X} ${verticalPipeEndY} Q ${PIPE_RIGHT_X} ${wallBottomY} ${CURVE_INNER_X} ${wallBottomY}`,
    stroke: PIPE_OUTLINE, 'stroke-width': '0.4', fill: 'none', opacity: '0.55',
  }));

  /* Horizontal extension into the last row card. Glass tint + thin
     outline lines, mirroring the look of the side feeders. */
  root.appendChild(svg('rect', {
    x: 0, y: wallTopY, width: CURVE_INNER_X, height: FEEDER_HEIGHT,
    fill: 'url(#usbPipeFeederGlass)',
  }));
  root.appendChild(svg('line', {
    x1: 0, y1: wallTopY, x2: CURVE_INNER_X, y2: wallTopY,
    stroke: PIPE_OUTLINE, 'stroke-width': '0.3', opacity: '0.5',
  }));
  root.appendChild(svg('line', {
    x1: 0, y1: wallBottomY, x2: CURVE_INNER_X, y2: wallBottomY,
    stroke: PIPE_OUTLINE, 'stroke-width': '0.3', opacity: '0.5',
  }));
}

function buildFeeders(root: SVGElement, geo: PipeGeometry): void {
  /* One side feeder per row except the last (the last row gets the
     curve from the main pipe). Each feeder is its own clipped group
     (water body + animated horizontal flow) plus a glass overlay
     rect and two thin outline lines. */
  for (let i = 0; i < geo.rowCenters.length - 1; i++) {
    const feederTopY = geo.rowCenters[i] - FEEDER_HEIGHT / 2;

    const g = svg('g', { 'clip-path': `url(#usbPipeFeeder${i}Clip)` });
    g.appendChild(svg('rect', {
      x: 0, y: feederTopY, width: FEEDER_END_X, height: FEEDER_HEIGHT,
      fill: 'url(#usbPipeWater)',
    }));
    g.appendChild(svg('rect', {
      'class': 'usb-pipe-water-feeder',
      x: -10, y: feederTopY, width: 40, height: FEEDER_HEIGHT,
      fill: 'url(#usbPipeFlowHoriz)',
    }));
    root.appendChild(g);

    root.appendChild(svg('rect', {
      x: 0, y: feederTopY, width: FEEDER_END_X, height: FEEDER_HEIGHT,
      fill: 'url(#usbPipeFeederGlass)',
    }));
    root.appendChild(svg('line', {
      x1: 0, y1: feederTopY, x2: FEEDER_END_X, y2: feederTopY,
      stroke: PIPE_OUTLINE, 'stroke-width': '0.3', opacity: '0.5',
    }));
    root.appendChild(svg('line', {
      x1: 0, y1: feederTopY + FEEDER_HEIGHT,
      x2: FEEDER_END_X, y2: feederTopY + FEEDER_HEIGHT,
      stroke: PIPE_OUTLINE, 'stroke-width': '0.3', opacity: '0.5',
    }));
  }
}

/**
 * Render the pipe overlay SVG inside a section container. Replaces
 * any existing overlay first so re-renders stay clean. No-op for
 * fewer than 2 sections — a single row doesn't need a pipe.
 *
 * Row Y positions are read from each <li>'s offsetTop, so the pipe
 * stays aligned with whatever the live layout actually is rather
 * than assuming a constant ROW_HEIGHT × index.
 */
export function renderActiveChapterPipe(
  container: HTMLElement,
  sectionCount: number,
): void {
  removeChapterPipe(container);
  if (sectionCount < 2) return;

  const ul = container.querySelector('ul');
  if (!ul) return;
  const rows = Array.from(ul.querySelectorAll<HTMLElement>(':scope > li'));
  if (rows.length < 2) return;

  /* offsetTop is relative to the nearest positioned ancestor. The
     <li>s sit inside the <ul> which sits inside .usb-sections (the
     container, position: relative), making .usb-sections the offset
     parent. offsetTop therefore matches our SVG's coordinate origin
     (we mount with top: 0 inside .usb-sections). */
  const rowCenters = rows.map(row => row.offsetTop + row.offsetHeight / 2);
  const lastRowCenterY = rowCenters[rowCenters.length - 1];
  const verticalPipeEndY = lastRowCenterY - CURVE_RADIUS;
  const wallTopY = lastRowCenterY - FEEDER_HEIGHT / 2;
  const wallBottomY = lastRowCenterY + FEEDER_HEIGHT / 2;

  /* SVG height matches the bottom of the extension walls + a 1px
     buffer for the round stroke linecap. The pipe never extends
     below lastRowCenterY beyond the wall thickness (1.5px). */
  const svgHeight = wallBottomY + 1;

  const geo: PipeGeometry = {
    rowCenters,
    lastRowCenterY,
    verticalPipeEndY,
    wallTopY,
    wallBottomY,
    svgHeight,
  };

  const root = svg('svg', {
    'class': 'usb-pipe-overlay',
    width: SVG_WIDTH,
    height: svgHeight,
    viewBox: `0 0 ${SVG_WIDTH} ${svgHeight}`,
    preserveAspectRatio: 'none',
    'aria-hidden': 'true',
    focusable: 'false',
  });

  root.appendChild(buildDefs(geo));
  buildMainPipe(root, geo);
  buildFeeders(root, geo);

  container.appendChild(root);
}

export function removeChapterPipe(container: HTMLElement): void {
  const existing = container.querySelector('.usb-pipe-overlay');
  if (existing) existing.remove();
}
