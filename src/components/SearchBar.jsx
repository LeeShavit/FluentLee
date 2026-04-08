import { Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'

export function SearchBar({ value, onChange, placeholder = 'Search cards...' }) {
  return (
    <div className="relative flex items-center">
      <Search className="absolute left-3 h-5 w-5 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 rounded-sm opacity-70 transition-opacity hover:opacity-100 focus:outline-none"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  )
}
