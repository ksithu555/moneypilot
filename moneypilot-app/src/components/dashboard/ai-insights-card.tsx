import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, AlertTriangle, TrendingUp, Lightbulb } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AiInsight {
  type: 'judgement' | 'suggestion' | 'forecast'
  data: {
    health_score?: number
    summary?: string
    suggestions?: Array<{ title: string; description: string; impact: 'high' | 'medium' | 'low' }>
    warnings?: Array<{ title: string; description: string }>
  }
  generated_at: string
}

interface AiInsightsCardProps {
  insights: AiInsight | null
}

export function AiInsightsCard({ insights }: AiInsightsCardProps) {
  if (!insights) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Insights</CardTitle>
          </div>
          <CardDescription>Powered by Claude</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Brain className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">No insights available yet</p>
            <p className="text-xs text-muted-foreground">Add more transactions to get personalized insights</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const healthScore = insights.data.health_score || 0
  const healthColor = healthScore >= 80 ? 'text-success' : healthScore >= 60 ? 'text-warning' : 'text-destructive'

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-primary" />
            <CardTitle>AI Insights</CardTitle>
          </div>
          <p className="text-xs text-muted-foreground">
            Updated {new Date(insights.generated_at).toLocaleDateString()}
          </p>
        </div>
        <CardDescription>Powered by Claude</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center gap-6">
          <div className="text-center">
            <div className={cn('text-4xl font-bold', healthColor)}>{healthScore}</div>
            <p className="text-xs text-muted-foreground">Health Score</p>
          </div>
          <div className="flex-1">
            <p className="text-sm">{insights.data.summary || 'Your financial health is being analyzed.'}</p>
          </div>
        </div>

        {insights.data.warnings && insights.data.warnings.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Warnings
            </h4>
            <div className="space-y-2">
              {insights.data.warnings.map((warning, i) => (
                <div key={i} className="p-3 bg-warning/10 rounded-md">
                  <p className="text-sm font-medium">{warning.title}</p>
                  <p className="text-xs text-muted-foreground">{warning.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {insights.data.suggestions && insights.data.suggestions.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-primary" />
              Suggestions
            </h4>
            <div className="space-y-2">
              {insights.data.suggestions.slice(0, 3).map((suggestion, i) => (
                <div key={i} className="p-3 bg-muted rounded-md">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium">{suggestion.title}</p>
                    <span className={cn(
                      'text-xs px-2 py-0.5 rounded-full',
                      suggestion.impact === 'high' ? 'bg-success/20 text-success' :
                      suggestion.impact === 'medium' ? 'bg-warning/20 text-warning' :
                      'bg-muted-foreground/20 text-muted-foreground'
                    )}>
                      {suggestion.impact} impact
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{suggestion.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
