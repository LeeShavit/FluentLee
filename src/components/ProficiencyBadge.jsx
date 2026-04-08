import { PROFICIENCY_COLORS, PROFICIENCY_LABELS, PROFICIENCY_DOTS } from '@/utils/proficiency'

export function ProficiencyBadge({ proficiency, showDots = true }) {
  const label = PROFICIENCY_LABELS[proficiency] || proficiency
  const colors = PROFICIENCY_COLORS[proficiency] || 'bg-gray-200 text-gray-700'
  const dotCount = showDots ? PROFICIENCY_DOTS[proficiency] || 0 : 0

  return (
    <div className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${colors}`}>
      <span>{label}</span>
      {dotCount > 0 && (
        <span className="flex gap-0.5">
          {Array.from({ length: dotCount }).map((_, i) => (
            <span key={i} className="inline-block">●</span>
          ))}
          {Array.from({ length: 3 - dotCount }).map((_, i) => (
            <span key={`empty-${i}`} className="inline-block opacity-30">○</span>
          ))}
        </span>
      )}
    </div>
  )
}
