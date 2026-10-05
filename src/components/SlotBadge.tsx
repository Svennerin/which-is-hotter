/**
 * The A/B marker used on the map, the buttons and the reveal cards, so the
 * player can match them up by shape and letter as well as colour.
 */
export function SlotBadge({ slot, size = 28 }: { slot: 'A' | 'B'; size?: number }) {
  const fill = slot === 'A' ? 'fill-marker-a' : 'fill-marker-b'
  return (
    <svg width={size} height={size} viewBox="-14 -14 28 28" aria-hidden="true" className="shrink-0">
      {slot === 'A' ? (
        <circle r={12} className={fill} />
      ) : (
        <rect x={-9} y={-9} width={18} height={18} transform="rotate(45)" className={fill} />
      )}
      <text textAnchor="middle" dy="0.35em" className="fill-white text-[12px] font-bold">
        {slot}
      </text>
    </svg>
  )
}
