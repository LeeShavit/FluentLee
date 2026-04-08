import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { getTags, getCards } from '@/data/db'

export default function TagStudy() {
  const navigate = useNavigate()
  const [tags, setTags] = useState([])
  const [selectedTagIds, setSelectedTagIds] = useState([])
  const [matchingCardCount, setMatchingCardCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadTags()
  }, [])

  async function loadTags() {
    try {
      setIsLoading(true)
      const fetchedTags = await getTags()
      setTags(fetchedTags)
    } catch (error) {
      console.error('Failed to load tags:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    async function countCards() {
      if (selectedTagIds.length === 0) {
        setMatchingCardCount(0)
        return
      }

      try {
        const cards = await getCards({ tagIds: selectedTagIds })
        setMatchingCardCount(cards.length)
      } catch (error) {
        console.error('Failed to count cards:', error)
      }
    }

    countCards()
  }, [selectedTagIds])

  function toggleTag(tagId) {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    )
  }

  function handleStartStudy() {
    if (selectedTagIds.length === 0 || matchingCardCount === 0) return
    const tagString = selectedTagIds.join(',')
    navigate(`/study?tags=${tagString}`)
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
          <h1 className="text-2xl font-bold">Study by Tag</h1>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-lg mx-auto px-4 py-6 pb-24">
        {isLoading ? (
          <div className="text-center text-muted-foreground py-8">Loading tags...</div>
        ) : tags.length === 0 ? (
          <div className="text-center text-muted-foreground py-12">
            <p>No tags available. Create some tags first.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Tag Selection */}
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">
                Select tags to study
              </h2>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    className={`px-4 py-2 rounded-full font-medium transition-colors ${
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

            {/* Card Count */}
            {selectedTagIds.length > 0 && (
              <div className="p-4 bg-accent rounded-lg">
                <p className="text-sm">
                  <span className="font-semibold">{matchingCardCount}</span>{' '}
                  card{matchingCardCount !== 1 ? 's' : ''} match your selection
                </p>
              </div>
            )}

            {/* Start Study Button */}
            <Button
              onClick={handleStartStudy}
              disabled={selectedTagIds.length === 0 || matchingCardCount === 0}
              className="w-full"
              size="lg"
            >
              Start Study
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
