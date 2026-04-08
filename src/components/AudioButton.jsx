import { Volume2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { speak } from '@/utils/audio'

export function AudioButton({ text }) {
  const handleClick = () => {
    if (text) {
      speak(text)
    }
  }

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={handleClick}
      className="h-8 w-8"
      title="Hear pronunciation"
    >
      <Volume2 className="h-4 w-4" />
    </Button>
  )
}
