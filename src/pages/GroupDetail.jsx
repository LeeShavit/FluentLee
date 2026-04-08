import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { ChevronLeft, MoreVertical, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { ProficiencyBadge } from '@/components/ProficiencyBadge'
import { ProficiencyBar } from '@/components/ProficiencyBar'
import { getGroup, getCards, getGroupStats, getTags, updateGroup, deleteGroup } from '@/data/db'
import { PROFICIENCY_ORDER, PROFICIENCY_LABELS } from '@/utils/proficiency'

export default function GroupDetail() {
  const { groupId } = useParams()
  const navigate = useNavigate()

  const [group, setGroup] = useState(null)
  const [cards, setCards] = useState([])
  const [allTags, setAllTags] = useState([])
  const [stats, setStats] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editingName, setEditingName] = useState('')
  const [proficiencyFilter, setProficiencyFilter] = useState('ALL')
  const [tagFilters, setTagFilters] = useState([])
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    loadData()
  }, [groupId])

  useEffect(() => {
    filterCards()
  }, [cards, proficiencyFilter, tagFilters])

  async function loadData() {
    try {
      setIsLoading(true)
      const fetchedGroup = await getGroup(groupId)
      if (!fetchedGroup) {
        navigate('/')
        return
      }

      setGroup(fetchedGroup)
      setEditingName(fetchedGroup.name)

      const fetchedCards = await getCards({ groupId })
      setCards(fetchedCards)

      const fetchedStats = await getGroupStats(groupId)
      setStats(fetchedStats)

      const fetchedTags = await getTags()
      setAllTags(fetchedTags)
    } catch (error) {
      console.error('Failed to load group:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function filterCards() {
    let filtered = cards

    if (proficiencyFilter !== 'ALL') {
      filtered = filtered.filter((c) => c.proficiency === proficiencyFilter)
    }

    if (tagFilters.length > 0) {
      filtered = filtered.filter((c) =>
        tagFilters.every((tagId) => c.tags.includes(tagId))
      )
    }

    return filtered
  }

  async function handleRenameGroup() {
    if (!editingName.trim() || editingName === group.name) {
      setIsEditing(false)
      return
    }

    try {
      const updated = await updateGroup(groupId, { name: editingName })
      setGroup(updated)
      setIsEditing(false)
    } catch (error) {
      console.error('Failed to update group:', error)
    }
  }

  async function handleDeleteGroup() {
    try {
      setIsDeleting(true)
      await deleteGroup(groupId)
      navigate('/')
    } catch (error) {
      console.error('Failed to delete group:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const filteredCards = filterCards()
  const statsDisplay = stats || { total: 0, new: 0, recognized: 0, recalled: 0, mastered: 0 }

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>
  }

  if (!group) {
    return <div className="min-h-screen flex items-center justify-center">Group not found</div>
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link to="/">
              <Button variant="ghost" size="icon">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>

            {isEditing ? (
              <div className="flex-1 flex gap-2 mx-2">
                <Input
                  autoFocus
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameGroup()
                    if (e.key === 'Escape') {
                      setIsEditing(false)
                      setEditingName(group.name)
                    }
                  }}
                  className="text-lg font-semibold"
                />
                <Button size="sm" onClick={handleRenameGroup}>
                  Save
                </Button>
              </div>
            ) : (
              <h1
                className="text-2xl font-bold flex-1 cursor-pointer hover:opacity-70 transition-opacity"
                onClick={() => setIsEditing(true)}
              >
                {group.name}
              </h1>
            )}

            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <button
                onClick={() => setDeleteDialogOpen(true)}
                className="p-2 hover:bg-accent rounded-md transition-colors"
              >
                <MoreVertical className="h-5 w-5" />
              </button>

              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Group</DialogTitle>
                </DialogHeader>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to delete "{group.name}"? This will also delete all {stats?.total || 0} cards in this group. This action cannot be undone.
                </p>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                  </DialogClose>
                  <Button variant="destructive" onClick={handleDeleteGroup} disabled={isDeleting}>
                    {isDeleting ? 'Deleting...' : 'Delete Group'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="max-w-lg mx-auto px-4 py-4 border-b border-border">
        <div className="text-sm text-muted-foreground mb-3">
          {statsDisplay.new > 0 && `${statsDisplay.new} New`}
          {statsDisplay.recognized > 0 && (statsDisplay.new > 0 ? ' · ' : '') + `${statsDisplay.recognized} Recognized`}
          {statsDisplay.recalled > 0 && ((statsDisplay.new > 0 || statsDisplay.recognized > 0) ? ' · ' : '') + `${statsDisplay.recalled} Recalled`}
          {statsDisplay.mastered > 0 && ((statsDisplay.new > 0 || statsDisplay.recognized > 0 || statsDisplay.recalled > 0) ? ' · ' : '') + `${statsDisplay.mastered} Mastered`}
          {statsDisplay.total === 0 && 'No cards yet'}
        </div>
        <ProficiencyBar stats={statsDisplay} />
      </div>

      {/* Filters */}
      <div className="max-w-lg mx-auto px-4 py-4 space-y-3 border-b border-border">
        <div>
          <label className="text-xs font-semibold text-muted-foreground">Proficiency</label>
          <Select
            value={proficiencyFilter}
            onChange={(e) => setProficiencyFilter(e.target.value)}
            className="mt-1"
          >
            <option value="ALL">All Levels</option>
            {PROFICIENCY_ORDER.map((level) => (
              <option key={level} value={level}>
                {PROFICIENCY_LABELS[level]}
              </option>
            ))}
          </Select>
        </div>

        {allTags.length > 0 && (
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Tags</label>
            <Select
              value=""
              onChange={(e) => {
                const tagId = e.target.value
                if (tagId && !tagFilters.includes(tagId)) {
                  setTagFilters([...tagFilters, tagId])
                }
              }}
              className="mt-1"
            >
              <option value="">Add filter...</option>
              {allTags
                .filter((tag) => !tagFilters.includes(tag.id))
                .map((tag) => (
                  <option key={tag.id} value={tag.id}>
                    {tag.name}
                  </option>
                ))}
            </Select>

            {tagFilters.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tagFilters.map((tagId) => {
                  const tag = allTags.find((t) => t.id === tagId)
                  return (
                    <button
                      key={tagId}
                      onClick={() => setTagFilters(tagFilters.filter((id) => id !== tagId))}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-primary text-primary-foreground hover:bg-primary/80 transition-colors"
                    >
                      {tag?.name}
                      <X className="h-3 w-3" />
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cards List */}
      <div className="max-w-lg mx-auto px-4 py-4">
        {filteredCards.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>{stats?.total === 0 ? 'No cards in this group yet' : 'No cards match the current filters'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredCards.map((card) => {
              const cardTags = card.tags
                .map((tagId) => allTags.find((t) => t.id === tagId))
                .filter(Boolean)

              return (
                <Link key={card.id} to={`/card/${card.id}/edit`}>
                  <Card className="transition-shadow hover:shadow-md cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm">{card.word}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {card.meaning}
                          </p>
                        </div>
                        <div className="flex-shrink-0">
                          <ProficiencyBadge proficiency={card.proficiency} showDots={false} />
                        </div>
                      </div>

                      {cardTags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {cardTags.map((tag) => (
                            <span
                              key={tag.id}
                              className="inline-block px-2 py-1 rounded text-xs bg-muted text-muted-foreground"
                            >
                              {tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>

      {/* Action Buttons - Sticky at bottom */}
      <div className="fixed bottom-0 left-0 right-0 border-t border-border bg-background">
        <div className="max-w-lg mx-auto px-4 py-4 flex gap-2">
          <Button asChild variant="outline" className="flex-1">
            <Link to={`/study?groupId=${groupId}`}>Study</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link to={`/card/new?groupId=${groupId}`}>Add Card</Link>
          </Button>
          <Button asChild variant="secondary" className="flex-1">
            <Link to={`/bulk-import?groupId=${groupId}`}>Bulk Import</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
