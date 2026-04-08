export const PROFICIENCY = {
  NEW: 'NEW',
  RECOGNIZED: 'RECOGNIZED',
  RECALLED: 'RECALLED',
  MASTERED: 'MASTERED',
}

export const PROFICIENCY_ORDER = ['NEW', 'RECOGNIZED', 'RECALLED', 'MASTERED']

export const PROFICIENCY_LABELS = {
  NEW: 'New',
  RECOGNIZED: 'Recognized',
  RECALLED: 'Recalled',
  MASTERED: 'Mastered',
}

export const PROFICIENCY_COLORS = {
  NEW: 'bg-gray-200 text-gray-700',
  RECOGNIZED: 'bg-blue-100 text-blue-700',
  RECALLED: 'bg-amber-100 text-amber-700',
  MASTERED: 'bg-green-100 text-green-700',
}

export const PROFICIENCY_DOTS = {
  NEW: 0,
  RECOGNIZED: 1,
  RECALLED: 2,
  MASTERED: 3,
}

export function nextProficiency(current) {
  const idx = PROFICIENCY_ORDER.indexOf(current)
  if (idx < PROFICIENCY_ORDER.length - 1) return PROFICIENCY_ORDER[idx + 1]
  return current
}

export function prevProficiency(current) {
  const idx = PROFICIENCY_ORDER.indexOf(current)
  if (idx > 0) return PROFICIENCY_ORDER[idx - 1]
  return current
}
