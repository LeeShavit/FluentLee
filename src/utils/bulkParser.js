/**
 * Parse bulk import text
 * Supports formats:
 *   - "word, meaning" (comma-separated)
 *   - "word | meaning" (pipe-separated)
 * One entry per line. Empty lines are skipped.
 *
 * @param {string} text - Raw input text
 * @returns {Array<{word: string, meaning: string}>} Parsed cards
 */
export function parseBulkCards(text) {
  const cards = []

  const lines = text.split('\n')
  for (const line of lines) {
    const trimmed = line.trim()

    // Skip empty lines
    if (!trimmed) continue

    let word, meaning

    // Try pipe separator first
    if (trimmed.includes('|')) {
      const parts = trimmed.split('|').map(p => p.trim())
      if (parts.length >= 2) {
        word = parts[0]
        meaning = parts.slice(1).join('|').trim() // In case meaning contains pipes
      }
    }
    // Try comma separator
    else if (trimmed.includes(',')) {
      const parts = trimmed.split(',').map(p => p.trim())
      if (parts.length >= 2) {
        word = parts[0]
        meaning = parts.slice(1).join(',').trim() // In case meaning contains commas
      }
    }

    // Only add if we got both word and meaning
    if (word && meaning) {
      cards.push({ word, meaning })
    }
  }

  return cards
}
