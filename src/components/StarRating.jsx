import { Star } from 'lucide-react'

export function StarRating({ value, onChange }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((rating) => (
        <button
          key={rating}
          onClick={() => onChange(rating)}
          className="focus:outline-none transition-transform hover:scale-110"
          type="button"
        >
          <Star
            className="h-5 w-5"
            fill={rating <= value ? 'currentColor' : 'none'}
            strokeWidth={rating <= value ? 0 : 2}
          />
        </button>
      ))}
    </div>
  )
}
