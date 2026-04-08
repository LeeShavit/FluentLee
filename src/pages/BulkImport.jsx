import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { getGroup, getTags, bulkCreateCards } from '@/data/db'
import { parseBulkCards } from '@/utils/bulkParser'

export default function BulkImport() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const groupId = searchParams.get('groupId')
  const [group, setGroup] = useState(null)
  const [tags, setTags] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState([])

  const [inputText, setInputText] = useState('')
  const [parsedCards, setParsedCards] = useState([])
  const [showPreview, setShowPreview] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadInitialData()
  }, [groupId])

  async function loadInitialData() {
    try {
      setIsLoading(true)

      if (!groupId) {
        console.error('No groupId provided')
        return
      }

      const fetchedGroup = await getGroup(groupId)
      setGroup(fetchedGroup)

      const fetchedTags = await getTags()
      setTags(fetchedTags)
    } catch (error) {
      console.error('Failed to load initial data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleParse() {
    const cards = parseBulkCards(inputText)
    setParsedCards(cards)
    setShowPreview(cards.length > 0)
  }

  function removeCard(index) {
    setParsedCards((prev) => prev.filter((_, i) => i !== index))
  }

  function toggleTag(tagId) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  async function handleImport() {
    if (parsedCards.length === 0 || !groupId) return

    try {
      setIsImporting(true)
      await bulkCreateCards(groupId, parsedCards, selectedTagIds)
      navigate(`/group/${groupId}`)
    } catch (error) {
      console.error('Failed to import cards:', error)
    } finally {
      setIsImporting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Group not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border sticky top-0 bg-background/95 backdrop-blur z-40">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 hover:bg-accent rounded-md transition-colors"
            aria-label="Go back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Bulk Import</h1>
            <p className="text-sm text-muted-foreground">{group.name}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24 space-y-6">
        {/* Instructions */}
        <div className="space-y-3">
          <p className="text-sm font-medium">
            Paste words below, one per line. Use comma or pipe to separate word and meaning.
          </p>
          <div className="bg-muted p-4 rounded-lg text-xs font-mono space-y-1 text-muted-foreground">
            <div>hola, hello</div>
            <div>gracias | thank you</div>
            <div>buenos días, good morning</div>
          </div>
        </div>

        {/* Input Textarea */}
        <div className="space-y-2">
          <label htmlFor="bulk-input" className="text-sm font-medium">
            Input
          </label>
          <Textarea
            id="bulk-input"
            placeholder="Enter cards here..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={8}
            className="font-mono text-sm"
          />
        </div>

        {/* Parse Button */}
        <Button
          onClick={handleParse}
          disabled={!inputText.trim()}
          className="w-full"
          variant="outline"
        >
          Parse
        </Button>

        {/* Preview Section */}
        {showPreview && (
          <div className="space-y-4">
            <div className="flex items-baseline justify-between">
              <h2 className="text-sm font-semibold">Preview</h2>
              <span className="text-xs text-muted-foreground">
                {parsedCards.length} card{parsedCards.length !== 1 ? 's' : ''}
              </span>
            </div>

            {parsedCards.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-6">
                No valid cards found. Check your format.
              </div>
            ) : (
              <div className="space-y-2">
                {/* Cards Table */}
                <div className="border border-border rounded-lg overflow-hidden">
                  <div className="grid grid-cols-12 gap-2 bg-muted p-3 border-b border-border text-xs font-medium">
                    <div className="col-span-1">#</div>
                    <div className="col-span-5">Word</div>
                    <div className="col-span-5">Meaning</div>
                    <div className="col-span-1"></div>
                  </div>
                  <div className="divide-y divide-border">
                    {parsedCards.map((card, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-12 gap-2 p-3 items-center text-sm hover:bg-muted/50"
                      >
                        <div className="col-span-1 text-xs text-muted-foreground">
                          {idx + 1}
                        </div>
                        <div className="col-span-5 font-medium truncate">
                          {card.word}
                        </div>
                        <div className="col-span-5 text-muted-foreground truncate">
                          {card.meaning}
                        </div>
                        <div className="col-span-1 flex justify-end">
                          <button
                            onClick={() => removeCard(idx)}
                            className="p-1 hover:bg-destructive/10 rounded transition-colors"
                            aria-label="Remove card"
                          >
                            <X className="h-4 w-4 text-destructive" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tag Selector */}
                <div className="space-y-3 mt-6">
                  <h3 className="text-sm font-semibold">Apply tags (optional)</h3>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.id}
                        onClick={() => toggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          selectedTagIds.includes(tag.id)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Import Button */}
        {parsedCards.length > 0 && (
          <Button
            onClick={handleImport}
            disabled={isImporting}
            className="w-full"
            size="lg"
          >
            {isImporting ? 'Importing...' : `Import ${parsedCards.length} Card${parsedCards.length !== 1 ? 's' : ''}`}
          </Button>
        )}
      </div>
    </div>
  )
}
