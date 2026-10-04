// Side profile of a generic mid-engine supercar, drawn for this project (no third-party asset).
// Coordinate box 1000×300, nose to the right, ground at y=290.
export const CAR_VIEWBOX = { w: 1000, h: 300 }

const REAR = { cx: 237, cy: 218, r: 72 }
const FRONT = { cx: 790, cy: 218, r: 72 }

export const CAR_BODY =
  'M38 236 L40 150 L56 118 L132 106 ' +
  'C250 86 370 64 470 58 C520 55 560 56 580 62 ' +
  'C640 92 690 130 724 150 ' +
  'C820 168 920 186 962 200 L976 214 L972 232 L940 246 L874 248 ' +
  'A84 84 0 0 0 706 248 L321 248 A84 84 0 0 0 153 248 Z'

export const CAR_WINDOW = 'M688 148 C650 120 610 92 578 72 C540 66 500 66 470 70 L420 140 C520 146 610 150 688 148 Z'

export const CAR_INTAKE = 'M432 160 L344 178 L332 230 L424 228 Z'

export const CAR_LINES = [
  'M58 150 C220 150 420 148 560 152 C700 156 860 184 962 210', // shoulder
  'M694 152 C704 190 704 222 696 246', // door cut
  'M900 180 L966 204 L944 208 Z', // headlight
  'M44 132 L120 124', // tail light
  'M840 258 L980 238', // splitter
  'M40 246 L150 256', // diffuser
  'M56 118 L40 112 L132 100', // spoiler lip
]

export const CAR_WHEELS = [REAR, FRONT]

// five spokes per rim
export const CAR_SPOKES = CAR_WHEELS.flatMap(({ cx, cy, r }) =>
  Array.from({ length: 5 }, (_, i) => {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2
    const r0 = r * 0.16, r1 = r * 0.66
    return `M${(cx + Math.cos(a) * r0).toFixed(1)} ${(cy + Math.sin(a) * r0).toFixed(1)} L${(cx + Math.cos(a) * r1).toFixed(1)} ${(cy + Math.sin(a) * r1).toFixed(1)}`
  }),
)
