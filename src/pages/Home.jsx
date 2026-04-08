import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { SearchBar } from '@/components/SearchBar'
import { GroupCard } from '@/components/GroupCard'
import { ProficiencyBadge } from '@/components/ProficiencyBadge'
import { getGroups, createGroup, getCards, getGroupStats } from '@/data/db'

export default function Home() {
  const [groups, setGroups] = useState([])
  const [stats, setStats] = useState({})
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [isCreating, setIsCreating] = useState(false)

  useEffect(() => {
    loadGroups()
  }, [])

  async function loadGroups() {
    try {
      setIsLoading(true)
      const fetchedGroups = await getGroups()
      setGroups(fetchedGroups)

      const statsMap = {}
      for (const group of fetchedGroups) {
        const groupStats = await getGroupStats(group.id)
        statsMap[group.id] = groupStats
      }
      setStats(statsMap)
    } catch (error) {
      console.error('Failed to load groups:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    async function performSearch() {
      if (searchQuery.trim() === '') {
        setSearchResults([])
        return
      }

      try {
        const results = await getCards({ search: searchQuery })
        setSearchResults(results)
      } catch (error) {
        console.error('Failed to search cards:', error)
      }
    }

    performSearch()
  }, [searchQuery])

  async function handleCreateGroup() {
    if (!newGroupName.trim()) return

    try {
      setIsCreating(true)
      await createGroup(newGroupName)
      setNewGroupName('')
      setDialogOpen(false)
      await loadGroups()
    } catch (error) {
      console.error('Failed to create group:', error)
    } finally {
      setIsCreating(false)
    }
  }

  const isSearching = searchQuery.trim() !== ''

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="max-w-lg mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold mb-4">FluentLee</h1>
          <SearchBar value={searchQuery} onChange={setSearchQuery} />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        ) : isSearching ? (
          <div className="space-y-3">
            <h2 className="font-semibold text-sm text-muted-foreground">
              {searchResults.length} result{searchResults.length !== 1 ? 's' : ''}
            </h2>
            {searchResults.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No cards found</p>
            ) : (
              <div className="space-y-2">
                {searchResults.map((card) => {
                  const group = groups.find((g) => g.id === card.groupId)
                  return (
                    <Link
                      key={card.id}
                      to={`/card/${card.id}/edit`}
                      className="block"
                    >
                      <Card className="transition-shadow hover:shadow-md cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm">{card.word}</p>
                              <p className="text-xs text-muted-foreground truncate">
                                {card.meaning}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {group?.name}
                              </p>
                            </div>
                            <div className="flex-shrink-0">
                              <ProficiencyBadge proficiency={card.proficiency} showDots={false} />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {groups.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <p>No groups yet. Create one to get started!</p>
              </div>
            ) : (
              groups.map((group) => (
                <GroupCard
                  key={group.id}
                  group={group}
                  stats={stats[group.id] || { total: 0, new: 0, recognized: 0, recalled: 0, mastered: 0 }}
                />
              ))
            )}
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      {!isSearching && (
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <button
            onClick={() => setDialogOpen(true)}
            className="fixed bottom-6 right-6 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 transition-colors flex items-center justify-center"
          >
            <Plus className="h-6 w-6" />
          </button>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Input
                  placeholder="Group name"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateGroup()
                    }
                  }}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline">Cancel</Button>
              </DialogClose>
              <Button onClick={handleCreateGroup} disabled={!newGroupName.trim() || isCreating}>
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
