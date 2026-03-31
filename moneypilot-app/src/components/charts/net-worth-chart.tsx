'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { format, subMonths } from 'date-fns'

interface NetWorthChartProps {
  householdId: string | undefined
}

export function NetWorthChart({ householdId }: NetWorthChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      if (!householdId) return

      const months = []
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        months.push({
          date,
          label: format(date, 'MMM'),
          netWorth: Math.random() * 50000 + 10000,
        })
      }

      setData(months)
      setLoading(false)
    }

    fetchData()
  }, [householdId])

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading...</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="label" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip 
          formatter={(value: number) => `$${value.toFixed(2)}`}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }} 
        />
        <Line 
          type="monotone" 
          dataKey="netWorth" 
          name="Net Worth"
          stroke="hsl(var(--primary))" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
