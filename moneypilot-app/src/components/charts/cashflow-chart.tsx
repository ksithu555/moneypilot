'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

export function CashflowChart() {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Generate 12 months from April to March (fiscal year style)
      const months = []
      const now = new Date()
      // Start from 11 months ago to current month
      for (let i = 11; i >= 0; i--) {
        const date = subMonths(now, i)
        months.push({
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, 'MMM'),
        })
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('created_by', user.id)
        .gte('txn_date', format(months[0].start, 'yyyy-MM-dd'))
        .lte('txn_date', format(months[11].end, 'yyyy-MM-dd'))

      const chartData = months.map(month => {
        const monthTxns = transactions?.filter(t => {
          const txnDate = new Date(t.txn_date + 'T00:00:00')
          return txnDate >= month.start && txnDate <= month.end
        }) || []

        const income = monthTxns
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const expenses = monthTxns
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        return {
          month: month.label,
          income,
          expenses,
        }
      })

      setData(chartData)
      setLoading(false)
    }

    fetchData()
  }, [supabase])

  if (loading) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">Loading...</div>
  }

  if (data.length === 0) {
    return <div className="h-[300px] flex items-center justify-center text-muted-foreground">No data available</div>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
        <XAxis dataKey="month" className="text-xs" />
        <YAxis className="text-xs" />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: 'hsl(var(--card))', 
            border: '1px solid hsl(var(--border))',
            borderRadius: '8px',
          }} 
        />
        <Legend />
        <Bar dataKey="income" name="Income" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
        <Bar dataKey="expenses" name="Expenses" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
