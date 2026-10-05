export interface Point {
  x: number
  y: number
}

export interface LabelPlacement {
  x: number
  y: number
  anchor: 'start' | 'middle' | 'end'
}

const CHAR_WIDTH = 7 // px per character at the 13px semibold label size (estimate)
const LABEL_HEIGHT = 18
const OFFSET = 15 // distance from marker centre to label baseline
const EDGE = 8 // keep labels this far inside the viewport

interface Box {
  left: number
  right: number
  top: number
  bottom: number
}

function boxFor(p: LabelPlacement, textLength: number): Box {
  const w = textLength * CHAR_WIDTH
  const left = p.anchor === 'start' ? p.x : p.anchor === 'end' ? p.x - w : p.x - w / 2
  return { left, right: left + w, top: p.y - LABEL_HEIGHT + 4, bottom: p.y + 4 }
}

const overlaps = (a: Box, b: Box) =>
  a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top

function place(marker: Point, textLength: number, width: number, below: boolean): LabelPlacement {
  const half = (textLength * CHAR_WIDTH) / 2
  // Slide the label sideways instead of clipping it at the map edge.
  let anchor: LabelPlacement['anchor'] = 'middle'
  if (marker.x - half < EDGE) anchor = 'start'
  else if (marker.x + half > width - EDGE) anchor = 'end'
  const x = anchor === 'start' ? Math.max(marker.x - 8, EDGE) : anchor === 'end' ? Math.min(marker.x + 8, width - EDGE) : marker.x
  return { x, y: below ? marker.y + OFFSET + 8 : marker.y - OFFSET + 2, anchor }
}

/**
 * Places two labels so they stay inside the viewport and do not overlap each
 * other. Text width is estimated from character count because measuring real
 * text would need the DOM; the estimate only has to be good enough to avoid
 * obvious collisions.
 */
export function placeLabels(
  markers: [Point, Point],
  lengths: [number, number],
  width: number,
  height: number,
): [LabelPlacement, LabelPlacement] {
  // Prefer above the marker; flip below when too close to the top edge.
  const wantsBelow = (m: Point) => m.y - OFFSET - LABEL_HEIGHT < EDGE
  const first = place(markers[0], lengths[0], width, wantsBelow(markers[0]))
  let second = place(markers[1], lengths[1], width, wantsBelow(markers[1]))

  if (overlaps(boxFor(first, lengths[0]), boxFor(second, lengths[1]))) {
    // Put the second label on the opposite side of its marker.
    const flipped = place(markers[1], lengths[1], width, second.y < markers[1].y)
    const fits = flipped.y < height - EDGE && flipped.y > EDGE + LABEL_HEIGHT
    if (fits) second = flipped
  }
  return [first, second]
}
