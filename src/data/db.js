import { generateClient } from 'aws-amplify/data'

let _client = null

function getClient() {
  if (!_client) {
    _client = generateClient()
  }
  return _client
}

const client = new Proxy({}, {
  get(_, prop) {
    return getClient()[prop]
  }
})

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

let seedPromise = null

async function seedTags() {
  if (!client) return
  const { data: existing } = await client.models.Tag.list({ limit: 1000 })
  const existingNames = new Set(existing.map(t => t.name.toLowerCase()))

  for (const name of SEED_TAGS) {
    if (!existingNames.has(name.toLowerCase())) {
      await client.models.Tag.create({ name })
    }
  }
}

// Run seed once on first import
seedPromise = seedTags().catch(() => {})

// Helper: wait for seed to finish before tag operations
async function ensureSeeded() {
  if (seedPromise) await seedPromise
}

// ============================================================================
// Helper: get tag IDs for a card via CardTag join table
// ============================================================================

async function getTagIdsForCard(cardId) {
  const { data: cardTags } = await client.models.CardTag.list({
    filter: { cardId: { eq: cardId } },
    limit: 1000,
  })
  return cardTags.map(ct => ct.tagId)
}

async function setTagsForCard(cardId, tagIds) {
  // Get existing card-tag associations
  const { data: existing } = await client.models.CardTag.list({
    filter: { cardId: { eq: cardId } },
    limit: 1000,
  })
  const existingTagIds = new Set(existing.map(ct => ct.tagId))
  const newTagIds = new Set(tagIds)

  // Delete removed tags
  for (const ct of existing) {
    if (!newTagIds.has(ct.tagId)) {
      await client.models.CardTag.delete({ id: ct.id })
    }
  }

  // Add new tags
  for (const tagId of tagIds) {
    if (!existingTagIds.has(tagId)) {
      await client.models.CardTag.create({ cardId, tagId })
    }
  }
}

// Helper: enrich card with tags array (to match old localStorage format)
async function enrichCard(card) {
  const tags = await getTagIdsForCard(card.id)
  return { ...card, tags }
}

// ============================================================================
// GROUPS
// ============================================================================

export async function getGroups() {
  const { data } = await client.models.Group.list({ limit: 1000 })
  return data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getGroup(id) {
  const { data } = await client.models.Group.get({ id })
  return data
}

export async function createGroup(name) {
  const { data } = await client.models.Group.create({ name })
  return data
}

export async function updateGroup(id, updates) {
  const { data } = await client.models.Group.update({ id, ...updates })
  return data
}

export async function deleteGroup(id) {
  // Delete all cards in the group (and their card-tag associations)
  const { data: cards } = await client.models.Card.list({
    filter: { groupId: { eq: id } },
    limit: 10000,
  })
  for (const card of cards) {
    // Delete card-tag associations
    const { data: cardTags } = await client.models.CardTag.list({
      filter: { cardId: { eq: card.id } },
      limit: 1000,
    })
    for (const ct of cardTags) {
      await client.models.CardTag.delete({ id: ct.id })
    }
    await client.models.Card.delete({ id: card.id })
  }
  await client.models.Group.delete({ id })
}

// ============================================================================
// CARDS
// ============================================================================

export async function getCards(filters = {}) {
  const { groupId, tagIds, proficiency, search } = filters

  // Build Amplify filter
  const filter = {}
  if (groupId) filter.groupId = { eq: groupId }
  if (proficiency) filter.proficiency = { eq: proficiency }

  const { data: cards } = await client.models.Card.list({
    filter: Object.keys(filter).length > 0 ? filter : undefined,
    limit: 10000,
  })

  // Enrich all cards with their tag IDs
  let enriched = await Promise.all(cards.map(enrichCard))

  // Client-side filter by tagIds (card must have ALL specified tags)
  if (tagIds && tagIds.length > 0) {
    enriched = enriched.filter(c =>
      tagIds.every(tagId => c.tags.includes(tagId))
    )
  }

  // Client-side search filter
  if (search) {
    const searchLower = search.toLowerCase()
    enriched = enriched.filter(c =>
      c.word.toLowerCase().includes(searchLower) ||
      c.meaning.toLowerCase().includes(searchLower)
    )
  }

  return enriched.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
}

export async function getCard(id) {
  const { data } = await client.models.Card.get({ id })
  if (!data) return null
  return enrichCard(data)
}

export async function createCard(cardData) {
  const { data } = await client.models.Card.create({
    groupId: cardData.groupId,
    word: cardData.word,
    meaning: cardData.meaning,
    example: cardData.example || null,
    significance: cardData.significance || 3,
    proficiency: cardData.proficiency || 'NEW',
  })

  // Create card-tag associations
  if (cardData.tags && cardData.tags.length > 0) {
    await setTagsForCard(data.id, cardData.tags)
  }

  return enrichCard(data)
}

export async function updateCard(id, updates) {
  const cardUpdate = { id }
  if (updates.groupId !== undefined) cardUpdate.groupId = updates.groupId
  if (updates.word !== undefined) cardUpdate.word = updates.word
  if (updates.meaning !== undefined) cardUpdate.meaning = updates.meaning
  if (updates.example !== undefined) cardUpdate.example = updates.example
  if (updates.significance !== undefined) cardUpdate.significance = updates.significance
  if (updates.proficiency !== undefined) cardUpdate.proficiency = updates.proficiency

  const { data } = await client.models.Card.update(cardUpdate)

  // Update card-tag associations if tags are provided
  if (updates.tags !== undefined) {
    await setTagsForCard(id, updates.tags)
  }

  return enrichCard(data)
}

export async function deleteCard(id) {
  // Delete card-tag associations first
  const { data: cardTags } = await client.models.CardTag.list({
    filter: { cardId: { eq: id } },
    limit: 1000,
  })
  for (const ct of cardTags) {
    await client.models.CardTag.delete({ id: ct.id })
  }
  await client.models.Card.delete({ id })
}

export async function bulkCreateCards(groupId, cards, tagIds = []) {
  const created = []
  for (const cardData of cards) {
    const { data } = await client.models.Card.create({
      groupId,
      word: cardData.word,
      meaning: cardData.meaning,
      example: null,
      significance: 3,
      proficiency: 'NEW',
    })

    if (tagIds.length > 0) {
      for (const tagId of tagIds) {
        await client.models.CardTag.create({ cardId: data.id, tagId })
      }
    }

    created.push({ ...data, tags: tagIds })
  }
  return created
}

export async function updateCardProficiency(id, proficiency) {
  const { data } = await client.models.Card.update({ id, proficiency })
  return data
}

// ============================================================================
// TAGS
// ============================================================================

export async function getTags() {
  await ensureSeeded()
  const { data } = await client.models.Tag.list({ limit: 1000 })
  return data.sort((a, b) => a.name.localeCompare(b.name))
}

export async function createTag(name) {
  const { data } = await client.models.Tag.create({ name })
  return data
}

export async function deleteTag(id) {
  // Delete all card-tag associations for this tag
  const { data: cardTags } = await client.models.CardTag.list({
    filter: { tagId: { eq: id } },
    limit: 10000,
  })
  for (const ct of cardTags) {
    await client.models.CardTag.delete({ id: ct.id })
  }
  await client.models.Tag.delete({ id })
}

// ============================================================================
// STATS
// ============================================================================

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
    const prof = (card.proficiency || 'NEW').toLowerCase()
    if (prof === 'new') stats.new++
    else if (prof === 'recognized') stats.recognized++
    else if (prof === 'recalled') stats.recalled++
    else if (prof === 'mastered') stats.mastered++
  }

  return stats
}
