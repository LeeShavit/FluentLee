import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { Trash2, Sparkles, Loader2, ChevronDown, X, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { AudioButton } from '@/components/AudioButton'
import { StarRating } from '@/components/StarRating'
import {
  getGroups,
  getTags,
  getCard,
  createCard,
  updateCard,
  deleteCard,
  createTag,
  createGroup,
} from '@/data/db'
import { PROFICIENCY, PROFICIENCY_LABELS } from '@/utils/proficiency'

// Capitalize: single word → capitalize first letter; phrase → only first letter of phrase
function capitalize(str) {
  const trimmed = str.trim()
  if (!trimmed) return trimmed
  return trimmed.charAt(0).toUpperCase() + trimmed.slice(1)
}

export default function CardEdit() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isEditMode = !!id

  // Form state
  const [groups, setGroups] = useState([])
  const [allTags, setAllTags] = useState([])
  const [selectedGroupId, setSelectedGroupId] = useState(searchParams.get('groupId') || '')
  const [word, setWord] = useState('')
  const [meaning, setMeaning] = useState('')
  const [example, setExample] = useState('')
  const [significance, setSignificance] = useState(3)
  const [proficiency, setProficiency] = useState(PROFICIENCY.NEW)
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [showNewGroupInput, setShowNewGroupInput] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [loading, setLoading] = useState(isEditMode)
  const [fetching, setFetching] = useState(false)

  // Tag multi-select state
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [tagSearch, setTagSearch] = useState('')
  const tagDropdownRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (tagDropdownRef.current && !tagDropdownRef.current.contains(e.target)) {
        setTagDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    if (isEditMode) loadCardData()
  }, [isEditMode, id])

  async function loadData() {
    const [groupsData, tagsData] = await Promise.all([getGroups(), getTags()])
    setGroups(groupsData)
    setAllTags(tagsData)
  }

  async function loadCardData() {
    const card = await getCard(id)
    if (card) {
      setSelectedGroupId(card.groupId)
      setWord(card.word)
      setMeaning(card.meaning)
      setExample(card.example || '')
      setSignificance(card.significance || 3)
      setProficiency(card.proficiency || PROFICIENCY.NEW)
      setSelectedTagIds(card.tags || [])
      setLoading(false)
    }
  }

  async function handleCreateNewGroup() {
    if (!newGroupName.trim()) return
    const group = await createGroup(newGroupName)
    setGroups([...groups, group])
    setSelectedGroupId(group.id)
    setNewGroupName('')
    setShowNewGroupInput(false)
  }

  async function handleCreateNewTag() {
    const name = capitalize(tagSearch)
    if (!name) return
    const tag = await createTag(name)
    setAllTags([...allTags, tag])
    setSelectedTagIds([...selectedTagIds, tag.id])
    setTagSearch('')
  }

  async function fetchDefinition() {
    if (!word.trim()) return
    setFetching(true)
    try {
      const res = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word.trim())}&langpair=es|en`
      )
      if (!res.ok) throw new Error('API error')
      const data = await res.json()

      const translation = data.responseData?.translatedText
      if (translation && translation.toLowerCase() !== word.trim().toLowerCase()) {
        if (!meaning) setMeaning(translation)
      } else {
        throw new Error('No translation')
      }
    } catch {
      alert('No translation found. Try a different word or fill in manually.')
    } finally {
      setFetching(false)
    }
  }

  function toggleTag(tagId) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId) ? prev.filter((i) => i !== tagId) : [...prev, tagId]
    )
  }

  function removeTag(tagId) {
    setSelectedTagIds((prev) => prev.filter((i) => i !== tagId))
  }

  async function handleSave() {
    if (!selectedGroupId || !word.trim() || !meaning.trim()) {
      alert('Please fill in Group, Word, and Meaning')
      return
    }

    const cardData = {
      groupId: selectedGroupId,
      word: capitalize(word),
      meaning: meaning.trim(),
      example: example.trim() || null,
      significance,
      proficiency,
      tags: selectedTagIds,
    }

    if (isEditMode) {
      await updateCard(id, cardData)
    } else {
      await createCard(cardData)
    }

    navigate(`/group/${selectedGroupId}`)
  }

  async function handleDelete() {
    await deleteCard(id)
    navigate(`/group/${selectedGroupId}`)
  }

  if (isEditMode && loading) {
    return <div className="max-w-lg mx-auto p-4">Loading...</div>
  }

  const selectedTags = selectedTagIds.map((tagId) => allTags.find((t) => t.id === tagId)).filter(Boolean)
  const filteredAvailableTags = allTags
    .filter((tag) => !selectedTagIds.includes(tag.id))
    .filter((tag) => tag.name.toLowerCase().includes(tagSearch.toLowerCase()))
  const exactMatch = allTags.some((t) => t.name.toLowerCase() === tagSearch.trim().toLowerCase())

  return (
    <div className="max-w-lg mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle>{isEditMode ? 'Edit Card' : 'Create New Card'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Group Selection */}
          <div className="space-y-2">
            <Label htmlFor="group">Group</Label>
            {!showNewGroupInput ? (
              <select
                id="group"
                value={selectedGroupId}
                onChange={(e) => {
                  if (e.target.value === '__new__') {
                    setShowNewGroupInput(true)
                  } else {
                    setSelectedGroupId(e.target.value)
                  }
                }}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">Select a group...</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
                <option value="__new__">+ Create new group</option>
              </select>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleCreateNewGroup()}
                />
                <Button size="sm" onClick={handleCreateNewGroup}>Create</Button>
                <Button size="sm" variant="ghost" onClick={() => { setShowNewGroupInput(false); setNewGroupName('') }}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {/* Word/Phrase */}
          <div className="space-y-2">
            <Label htmlFor="word">Word / Phrase</Label>
            <div className="flex gap-2">
              <Input
                id="word"
                placeholder="e.g. Café"
                value={word}
                onChange={(e) => setWord(e.target.value)}
                required
              />
              <AudioButton text={word} />
              <Button
                size="icon"
                variant="outline"
                onClick={fetchDefinition}
                disabled={!word.trim() || fetching}
                title="Fetch translation"
              >
                {fetching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Type a Spanish word, then tap ✦ to auto-fill the English meaning</p>
          </div>

          {/* Meaning */}
          <div className="space-y-2">
            <Label htmlFor="meaning">Meaning</Label>
            <Input
              id="meaning"
              placeholder="e.g. Coffee"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              required
            />
          </div>

          {/* Example Sentence */}
          <div className="space-y-2">
            <Label htmlFor="example">Example Sentence (optional)</Label>
            <Textarea
              id="example"
              placeholder="e.g. Me gusta el café por la mañana"
              value={example}
              onChange={(e) => setExample(e.target.value)}
            />
          </div>

          {/* Tags - Multi-select dropdown */}
          <div className="space-y-2">
            <Label>Tags</Label>
            <div ref={tagDropdownRef} className="relative">
              {/* Selected tags + input */}
              <div
                className="flex flex-wrap gap-1.5 min-h-10 w-full rounded-md border border-input bg-background px-2 py-1.5 cursor-text"
                onClick={() => { setTagDropdownOpen(true) }}
              >
                {selectedTags.map((tag) => (
                  <Badge key={tag.id} variant="secondary" className="gap-1 pr-1">
                    {tag.name}
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); removeTag(tag.id) }}
                      className="ml-0.5 rounded-full hover:bg-muted-foreground/20 p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  className="flex-1 min-w-[80px] bg-transparent text-sm outline-none placeholder:text-muted-foreground py-1"
                  placeholder={selectedTags.length === 0 ? 'Search or create tags...' : 'Add more...'}
                  value={tagSearch}
                  onChange={(e) => { setTagSearch(e.target.value); setTagDropdownOpen(true) }}
                  onFocus={() => setTagDropdownOpen(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !tagSearch && selectedTagIds.length > 0) {
                      removeTag(selectedTagIds[selectedTagIds.length - 1])
                    }
                    if (e.key === 'Enter' && tagSearch.trim() && !exactMatch) {
                      e.preventDefault()
                      handleCreateNewTag()
                    }
                  }}
                />
                <ChevronDown className="h-4 w-4 self-center text-muted-foreground shrink-0" />
              </div>

              {/* Dropdown */}
              {tagDropdownOpen && (
                <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-md max-h-48 overflow-y-auto">
                  {filteredAvailableTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer"
                      onClick={() => { toggleTag(tag.id); setTagSearch('') }}
                    >
                      {tag.name}
                    </button>
                  ))}
                  {tagSearch.trim() && !exactMatch && (
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 text-sm hover:bg-accent cursor-pointer flex items-center gap-2 text-primary"
                      onClick={handleCreateNewTag}
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Create "{capitalize(tagSearch)}"
                    </button>
                  )}
                  {filteredAvailableTags.length === 0 && (!tagSearch.trim() || exactMatch) && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">No more tags available</div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Significance */}
          <div className="space-y-3">
            <Label>Significance</Label>
            <StarRating value={significance} onChange={setSignificance} />
          </div>

          {/* Proficiency */}
          <div className="space-y-3">
            <Label>Proficiency</Label>
            <div className="flex gap-2">
              {Object.values(PROFICIENCY).map((prof) => (
                <Button
                  key={prof}
                  variant={proficiency === prof ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setProficiency(prof)}
                >
                  {PROFICIENCY_LABELS[prof]}
                </Button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button className="flex-1" onClick={handleSave}>
              {isEditMode ? 'Update Card' : 'Create Card'}
            </Button>
            {isEditMode && (
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Card</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this card? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
