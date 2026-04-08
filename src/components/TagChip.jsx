import { X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'

export function TagChip({ tag, onRemove, onClick }) {
  return (
    <Badge
      variant="secondary"
      className="flex items-center gap-1 cursor-pointer hover:bg-secondary/90"
      onClick={onClick}
    >
      <span>{tag.name}</span>
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag.id)
          }}
          className="ml-0.5 hover:text-foreground"
        >
          <X className="h-3 w-3" />
        </button>
      )}
    </Badge>
  )
}
