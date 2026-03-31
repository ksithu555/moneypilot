import { Progress } from '@/components/ui/progress'
import { formatCurrency } from '@/lib/utils'
import { Target } from 'lucide-react'

interface Goal {
  id: string
  name: string
  target_amount: number
  saved_amount: number
  target_date: string | null
  color: string
}

interface GoalsProgressProps {
  goals: Goal[]
  currency: string
}

export function GoalsProgress({ goals, currency }: GoalsProgressProps) {
  if (goals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No goals yet</p>
        <p className="text-xs text-muted-foreground">Create your first savings goal</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {goals.slice(0, 4).map((goal) => {
        const progress = Math.min((goal.saved_amount / goal.target_amount) * 100, 100)
        const isComplete = goal.saved_amount >= goal.target_amount

        return (
          <div key={goal.id} className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{goal.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(goal.saved_amount, currency)} / {formatCurrency(goal.target_amount, currency)}
              </span>
            </div>
            <Progress 
              value={progress} 
              className="h-2"
              style={{ '--progress-color': goal.color || 'hsl(var(--primary))' } as React.CSSProperties}
            />
            {goal.target_date && !isComplete && (
              <p className="text-xs text-muted-foreground">
                Target: {new Date(goal.target_date).toLocaleDateString()}
              </p>
            )}
            {isComplete && (
              <p className="text-xs text-success font-medium">Goal achieved!</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
