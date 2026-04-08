import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { AudioButton } from '@/components/AudioButton'
import { getCards } from '@/data/db'
import { PROFICIENCY, PROFICIENCY_LABELS, PROFICIENCY_COLORS, nextProficiency } from '@/utils/proficiency'

export default function StudyMode() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const groupId = searchParams.get('groupId')
  const tagParam = searchParams.get('tags')

  // State
  const [phase, setPhase] = useState('setup') // setup, studying, complete
  const [allCards, setAllCards] = useState([])
  const [filteredCards, setFilteredCards] = useState([])
  const [shuffledCards, setShuffledCards] = useState([])
  const [currentCardIndex, setCurrentCardIndex] = useState(0)
  const [isFlipped, setIsFlipped] = useState(false)
  const [results, setResults] = useState([])

  // Setup config
  const [reverseMode, setReverseMode] = useState(false)
  const [proficiencyFilter, setProficiencyFilter] = useState({
    NEW: true,
    RECOGNIZED: true,
    RECALLED: true,
    MASTERED: true,
  })

  // Load cards on mount
  useEffect(() => {
    loadCards()
  }, [])

  async function loadCards() {
    const filters = {}
    if (groupId) filters.groupId = groupId
    if (tagParam) {
      const tagIds = tagParam.split(',')
      filters.tagIds = tagIds
    }
    const cards = await getCards(filters)
    setAllCards(cards)
    setFilteredCards(cards)
  }

  function updateFilteredCards() {
    const filtered = allCards.filter((card) => proficiencyFilter[card.proficiency])
    setFilteredCards(filtered)
  }

  function toggleProficiency(prof) {
    const updated = {
      ...proficiencyFilter,
      [prof]: !proficiencyFilter[prof],
    }
    setProficiencyFilter(updated)

    const filtered = allCards.filter((card) => updated[card.proficiency])
    setFilteredCards(filtered)
  }

  function startStudy() {
    if (filteredCards.length === 0) {
      alert('No cards to study with current filters')
      return
    }

    // Shuffle cards
    const shuffled = [...filteredCards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setResults([])
    setPhase('studying')
  }

  function handleCardResponse(gotIt) {
    const currentCard = shuffledCards[currentCardIndex]
    results.push({ card: currentCard, gotIt })
    setResults([...results])

    const nextIndex = currentCardIndex + 1
    if (nextIndex < shuffledCards.length) {
      setCurrentCardIndex(nextIndex)
      setIsFlipped(false)
    } else {
      setPhase('complete')
    }
  }

  function handleProficiencyChange(cardId) {
    const cardIndex = results.findIndex((r) => r.card.id === cardId)
    if (cardIndex === -1) return

    const result = results[cardIndex]
    const newProf = nextProficiency(result.card.proficiency)
    result.card.proficiency = newProf

    // Optimistically update the card in memory
    // (In a real app, this would call updateCardProficiency to DB)
    setResults([...results])
  }

  function goBackToGroup() {
    if (groupId) {
      navigate(`/group/${groupId}`)
    } else {
      navigate('/')
    }
  }

  function restartStudy() {
    setPhase('studying')
    const shuffled = [...shuffledCards].sort(() => Math.random() - 0.5)
    setShuffledCards(shuffled)
    setCurrentCardIndex(0)
    setIsFlipped(false)
    setResults([])
  }

  if (phase === 'setup') {
    return (
      <div className="max-w-lg mx-auto p-4">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <h2 className="text-xl font-semibold">Study Mode Setup</h2>

            {/* Direction Toggle */}
            <div className="space-y-3">
              <p className="font-medium text-sm">Direction</p>
              <div className="flex gap-2">
                <Button
                  variant={!reverseMode ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setReverseMode(false)}
                >
                  Spanish → English
                </Button>
                <Button
                  variant={reverseMode ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setReverseMode(true)}
                >
                  English → Spanish
                </Button>
              </div>
            </div>

            <Separator />

            {/* Proficiency Filter */}
            <div className="space-y-3">
              <p className="font-medium text-sm">Include proficiency levels</p>
              <div className="space-y-2">
                {Object.keys(PROFICIENCY).map((prof) => (
                  <label key={prof} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={proficiencyFilter[prof]}
                      onChange={() => toggleProficiency(prof)}
                      className="rounded"
                    />
                    <span className="text-sm">{PROFICIENCY_LABELS[prof]}</span>
                  </label>
                ))}
              </div>
            </div>

            <Separator />

            {/* Card Count */}
            <div className="p-3 bg-muted rounded-md">
              <p className="text-sm">
                <span className="font-semibold">{filteredCards.length}</span> cards available
              </p>
            </div>

            {/* Start Button */}
            <Button
              className="w-full"
              size="lg"
              onClick={startStudy}
              disabled={filteredCards.length === 0}
            >
              Start Study
            </Button>

            <Button variant="outline" className="w-full" onClick={goBackToGroup}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (phase === 'studying') {
    const currentCard = shuffledCards[currentCardIndex]
    const front = reverseMode ? currentCard.meaning : currentCard.word
    const back = reverseMode ? currentCard.word : currentCard.meaning
    const progress = `${currentCardIndex + 1} / ${shuffledCards.length}`

    return (
      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Progress */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{progress}</span>
          <span>
            Got it: {results.filter((r) => r.gotIt).length} | Missed:{' '}
            {results.filter((r) => !r.gotIt).length}
          </span>
        </div>

        {/* Flashcard */}
        <div
          className="h-64 cursor-pointer"
          onClick={() => setIsFlipped(!isFlipped)}
          style={{ perspective: '1000px' }}
        >
          <div
            className="relative h-full w-full transition-transform duration-500"
            style={{
              transformStyle: 'preserve-3d',
              transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
            }}
          >
            {/* Front face */}
            <Card
              className="absolute inset-0 flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden' }}
            >
              <CardContent className="p-6 text-center space-y-4 w-full">
                <p className="text-sm text-muted-foreground">Front</p>
                <p className="text-4xl font-bold">{front}</p>
                {!reverseMode && <AudioButton text={currentCard.word} />}
                <p className="text-xs text-muted-foreground pt-4">Tap to reveal</p>
              </CardContent>
            </Card>

            {/* Back face */}
            <Card
              className="absolute inset-0 flex items-center justify-center"
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            >
              <CardContent className="p-6 text-center space-y-4 w-full">
                <p className="text-sm text-muted-foreground">Back</p>
                <p className="text-3xl font-semibold">{back}</p>
                {currentCard.example && (
                  <>
                    <Separator className="my-2" />
                    <p className="text-sm italic text-muted-foreground">
                      "{currentCard.example}"
                    </p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Proficiency Indicator */}
        {isFlipped && (
          <div className="flex items-center justify-between p-3 bg-muted rounded-md">
            <span className="text-xs text-muted-foreground">Current proficiency:</span>
            <button
              onClick={() => handleProficiencyChange(currentCard.id)}
              className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold cursor-pointer hover:opacity-80 ${
                PROFICIENCY_COLORS[currentCard.proficiency]
              }`}
            >
              {PROFICIENCY_LABELS[currentCard.proficiency]}
            </button>
          </div>
        )}

        {/* Response Buttons */}
        {isFlipped && (
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
              onClick={() => handleCardResponse(false)}
            >
              <X className="h-4 w-4 mr-2" />
              Missed
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-green-200 text-green-600 hover:bg-green-50"
              onClick={() => handleCardResponse(true)}
            >
              <Check className="h-4 w-4 mr-2" />
              Got it
            </Button>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'complete') {
    const gotItCount = results.filter((r) => r.gotIt).length
    const missedCount = results.filter((r) => !r.gotIt).length
    const missedCards = results.filter((r) => !r.gotIt).map((r) => r.card)

    return (
      <div className="max-w-lg mx-auto p-4">
        <Card>
          <CardContent className="pt-6 space-y-6">
            <h2 className="text-2xl font-bold text-center">Session Complete!</h2>

            {/* Summary Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="text-center p-3 bg-muted rounded-md">
                <p className="text-2xl font-bold">{results.length}</p>
                <p className="text-xs text-muted-foreground">Total Reviewed</p>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-md">
                <p className="text-2xl font-bold text-green-600">{gotItCount}</p>
                <p className="text-xs text-muted-foreground">Got it</p>
              </div>
              <div className="text-center p-3 bg-red-50 rounded-md">
                <p className="text-2xl font-bold text-red-600">{missedCount}</p>
                <p className="text-xs text-muted-foreground">Missed</p>
              </div>
            </div>

            {/* Missed Cards */}
            {missedCards.length > 0 && (
              <>
                <Separator />
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Cards to Review</h3>
                  <div className="space-y-2">
                    {missedCards.map((card) => (
                      <div
                        key={card.id}
                        className="p-3 bg-muted rounded-md text-sm"
                      >
                        <p className="font-medium">{card.word}</p>
                        <p className="text-muted-foreground">{card.meaning}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4">
              <Button className="flex-1" onClick={restartStudy}>
                Study Again
              </Button>
              <Button variant="outline" className="flex-1" onClick={goBackToGroup}>
                Back to Group
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }
}
