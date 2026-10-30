/**
 * SimilarityBadge — displays an AI plagiarism/similarity score.
 * Turns red with a pulsing animation if score > 75.
 */
export default function SimilarityBadge({ score }) {
  if (score == null) return <span className="text-xs text-gray-500">Not analyzed</span>
  const pct     = Number(score)
  const isHigh  = pct >= 75
  const isMid   = pct > 40 && pct < 75

  const bg    = isHigh ? '#fef2f2' : isMid ? '#fffbeb' : '#f0fdf4'
  const color = isHigh ? '#b91c1c' : isMid ? '#92400e' : '#166534'
  const ring  = isHigh ? '#fecaca' : isMid ? '#fde68a' : '#bbf7d0'

  return (
    <span
      className={isHigh ? 'badge-danger-pulse' : ''}
      style={{
        display:      'inline-flex',
        alignItems:   'center',
        gap:          '4px',
        padding:      '3px 10px',
        borderRadius: '9999px',
        fontSize:     '12px',
        fontWeight:   600,
        background:   bg,
        color,
        border:       `1px solid ${ring}`,
        letterSpacing: '0.02em',
        whiteSpace:   'nowrap',
      }}
    >
      {isHigh && (
        <span style={{ fontSize: '10px' }}>⚠</span>
      )}
      {pct}%
    </span>
  )
}
