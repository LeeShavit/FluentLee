import { v4 as uuidv4 } from 'uuid'
import { PROFICIENCY } from '../utils/proficiency.js'

// Storage keys
const GROUPS_KEY = 'flashcards_groups'
const CARDS_KEY = 'flashcards_cards'
const TAGS_KEY = 'flashcards_tags'

// ============================================================================
// Helper functions for localStorage
// ============================================================================

function load(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || []
  } catch {
    return []
  }
}

function save(key, data) {
  localStorage.setItem(key, JSON.stringify(data))
}

// ============================================================================
// SEED TAGS
// ============================================================================

const SEED_TAGS = [
  'Noun', 'Verb', 'Adjective', 'Adverb', 'Preposition',
  'Pronoun', 'Conjunction', 'Phrase', 'Idiom', 'Slang',
  'Greetings', 'Daily Routine', 'Food & Drink', 'Travel',
  'Shopping', 'Work', 'Health', 'Family', 'Emotions',
  'Weather', 'Numbers', 'Time', 'Directions', 'Home',
  'Hobbies', 'Nature', 'Clothing', 'Body', 'Emergency',
  'Conversation',
]

function seedTags() {
  const existing = load(TAGS_KEY)
  const existingNames = new Set(existing.map(t => t.name.toLowerCase()))
  let updated = false

  for (const name of SEED_TAGS) {
    if (!existingNames.has(name.toLowerCase())) {
      existing.push({ id: uuidv4(), name })
      updated = true
    }
  }

  if (updated) save(TAGS_KEY, existing)
}

seedTags()

// ============================================================================
// GROUPS
// ============================================================================

/**
 * Get all groups
 * @returns {Promise<Array>}
 */
export async function getGroups() {
  return load(GROUPS_KEY)
}

/**
 * Get a single group by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getGroup(id) {
  const groups = load(GROUPS_KEY)
  return groups.find(g => g.id === id) || null
}

/**
 * Create a new group
 * @param {string} name
 * @returns {Promise<Object>} Created group
 */
export async function createGroup(name) {
  const groups = load(GROUPS_KEY)
  const group = {
    id: uuidv4(),
    name,
    createdAt: new Date().toISOString(),
  }
  groups.push(group)
  save(GROUPS_KEY, groups)
  return group
}

/**
 * Update a group
 * @param {string} id
 * @param {Object} updates - { name, ... }
 * @returns {Promise<Object>} Updated group
 */
export async function updateGroup(id, updates) {
  const groups = load(GROUPS_KEY)
  const group = groups.find(g => g.id === id)
  if (!group) throw new Error(`Group ${id} not found`)

  Object.assign(group, updates)
  save(GROUPS_KEY, groups)
  return group
}

/**
 * Delete a group and all its cards
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteGroup(id) {
  let groups = load(GROUPS_KEY)
  let cards = load(CARDS_KEY)

  groups = groups.filter(g => g.id !== id)
  cards = cards.filter(c => c.groupId !== id)

  save(GROUPS_KEY, groups)
  save(CARDS_KEY, cards)
}

// ============================================================================
// CARDS
// ============================================================================

/**
 * Get filtered cards
 * @param {Object} filters
 *   - groupId {string} - Filter by group
 *   - tagIds {Array<string>} - Filter by tags (card must have ALL)
 *   - proficiency {string} - Filter by proficiency level
 *   - search {string} - Search in word and meaning (case-insensitive)
 * @returns {Promise<Array>}
 */
export async function getCards(filters = {}) {
  const { groupId, tagIds, proficiency, search } = filters
  let cards = load(CARDS_KEY)

  // Filter by groupId
  if (groupId) {
    cards = cards.filter(c => c.groupId === groupId)
  }

  // Filter by proficiency
  if (proficiency) {
    cards = cards.filter(c => c.proficiency === proficiency)
  }

  // Filter by tagIds (card must have all specified tags)
  if (tagIds && tagIds.length > 0) {
    cards = cards.filter(c =>
      tagIds.every(tagId => c.tags.includes(tagId))
    )
  }

  // Filter by search (case-insensitive, searches word and meaning)
  if (search) {
    const searchLower = search.toLowerCase()
    cards = cards.filter(c =>
      c.word.toLowerCase().includes(searchLower) ||
      c.meaning.toLowerCase().includes(searchLower)
    )
  }

  return cards
}

/**
 * Get a single card by ID
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
export async function getCard(id) {
  const cards = load(CARDS_KEY)
  return cards.find(c => c.id === id) || null
}

/**
 * Create a new card
 * @param {Object} cardData
 *   - groupId {string}
 *   - word {string}
 *   - meaning {string}
 *   - example {string|null}
 *   - significance {number} default 3
 *   - proficiency {string} default 'NEW'
 *   - tags {Array<string>} default []
 * @returns {Promise<Object>} Created card
 */
export async function createCard(cardData) {
  const cards = load(CARDS_KEY)

  const card = {
    id: uuidv4(),
    groupId: cardData.groupId,
    word: cardData.word,
    meaning: cardData.meaning,
    example: cardData.example || null,
    significance: cardData.significance || 3,
    proficiency: cardData.proficiency || PROFICIENCY.NEW,
    tags: cardData.tags || [],
    createdAt: new Date().toISOString(),
  }

  cards.push(card)
  save(CARDS_KEY, cards)
  return card
}

/**
 * Update a card
 * @param {string} id
 * @param {Object} updates - Partial card object
 * @returns {Promise<Object>} Updated card
 */
export async function updateCard(id, updates) {
  const cards = load(CARDS_KEY)
  const card = cards.find(c => c.id === id)
  if (!card) throw new Error(`Card ${id} not found`)

  Object.assign(card, updates)
  save(CARDS_KEY, cards)
  return card
}

/**
 * Delete a card
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteCard(id) {
  let cards = load(CARDS_KEY)
  cards = cards.filter(c => c.id !== id)
  save(CARDS_KEY, cards)
}

/**
 * Bulk create cards
 * @param {string} groupId
 * @param {Array<{word, meaning}>} cards - Array of card data
 * @param {Array<string>} tagIds - Tags to apply to all cards
 * @returns {Promise<Array>} Created cards
 */
export async function bulkCreateCards(groupId, cards, tagIds = []) {
  const existing = load(CARDS_KEY)
  const created = []

  for (const cardData of cards) {
    const card = {
      id: uuidv4(),
      groupId,
      word: cardData.word,
      meaning: cardData.meaning,
      example: null,
      significance: 3,
      proficiency: PROFICIENCY.NEW,
      tags: tagIds,
      createdAt: new Date().toISOString(),
    }
    existing.push(card)
    created.push(card)
  }

  save(CARDS_KEY, existing)
  return created
}

/**
 * Update card proficiency
 * @param {string} id
 * @param {string} proficiency
 * @returns {Promise<Object>} Updated card
 */
export async function updateCardProficiency(id, proficiency) {
  return updateCard(id, { proficiency })
}

// ============================================================================
// TAGS
// ============================================================================

/**
 * Get all tags
 * @returns {Promise<Array>}
 */
export async function getTags() {
  return load(TAGS_KEY)
}

/**
 * Create a new tag
 * @param {string} name
 * @returns {Promise<Object>} Created tag
 */
export async function createTag(name) {
  const tags = load(TAGS_KEY)

  const tag = {
    id: uuidv4(),
    name,
  }

  tags.push(tag)
  save(TAGS_KEY, tags)
  return tag
}

/**
 * Delete a tag and remove it from all cards
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteTag(id) {
  let tags = load(TAGS_KEY)
  let cards = load(CARDS_KEY)

  tags = tags.filter(t => t.id !== id)
  cards = cards.map(c => ({
    ...c,
    tags: c.tags.filter(tagId => tagId !== id),
  }))

  save(TAGS_KEY, tags)
  save(CARDS_KEY, cards)
}

// ============================================================================
// STATS
// ============================================================================

/**
 * Get stats for a group
 * @param {string} groupId
 * @returns {Promise<Object>} { total, new, recognized, recalled, mastered }
 */
export async function getGroupStats(groupId) {
  const cards = await getCards({ groupId })

  const stats = {
    total: cards.length,
    new: 0,
    recognized: 0,
    recalled: 0,
    mastered: 0,
  }

  for (const card of cards) {
    const prof = card.proficiency.toLowerCase()
    if (prof === 'new') stats.new++
    else if (prof === 'recognized') stats.recognized++
    else if (prof === 'recalled') stats.recalled++
    else if (prof === 'mastered') stats.mastered++
  }

  return stats
}
