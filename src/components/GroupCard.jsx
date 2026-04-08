import { Link } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { ProficiencyBar } from './ProficiencyBar'

export function GroupCard({ group, stats }) {
  const cardCount = stats?.total || 0

  return (
    <Link to={`/group/${group.id}`}>
      <Card className="transition-shadow hover:shadow-md cursor-pointer">
        <CardContent className="p-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-lg">{group.name}</h3>
              <p className="text-sm text-muted-foreground">
                {cardCount} card{cardCount !== 1 ? 's' : ''}
              </p>
            </div>
            <ProficiencyBar stats={stats} />
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
