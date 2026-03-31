'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'
import { startOfMonth, endOfMonth } from 'date-fns'

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16']

export function CategoryBreakdown() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const monthStart = startOfMonth(now)
      const monthEnd = endOfMonth(now)

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('created_by', user.id)
        .eq('type', 'expense')
        .gte('txn_date', monthStart.toISOString().split('T')[0])
        .lte('txn_date', monthEnd.toISOString().split('T')[0])

      const categoryTotals: Record<string, { name: string; value: number; color: string }> = {}

      transactions?.forEach(t => {
        const categoryName = t.categories?.name || 'Uncategorized'
        const categoryColor = t.categories?.color || '#6b7280'
        
        if (!categoryTotals[categoryName]) {
          categoryTotals[categoryName] = { name: categoryName, value: 0, color: categoryColor }
        }
        categoryTotals[categoryName].value += Math.abs(t.amount)
      })

      const chartData = Object.values(categoryTotals)
        .sort((a, b) => b.value - a.value)
        .slice(0, 8)

      setData(chartData)
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading...</div>
  }

  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No expenses this month</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={2}
          dataKey="value"
          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          labelLine={false}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
          ))}
        </Pie>
        <Tooltip 
          formatter={(value: number) => `$${value.toFixed(2)}`}
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }} 
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
