'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'

interface CashflowChartProps {
  householdId: string | undefined
}

export function CashflowChart({ householdId }: CashflowChartProps) {
  const [data, setData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchData() {
      if (!householdId) return

      const months = []
      for (let i = 5; i >= 0; i--) {
        const date = subMonths(new Date(), i)
        months.push({
          start: startOfMonth(date),
          end: endOfMonth(date),
          label: format(date, 'MMM'),
        })
      }

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, accounts!inner(*)')
        .eq('accounts.household_id', householdId)
        .gte('txn_date', months[0].start.toISOString())
        .lte('txn_date', months[5].end.toISOString())

      const chartData = months.map(month => {
        const monthTxns = transactions?.filter(t => {
          const txnDate = new Date(t.txn_date)
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
  }, [householdId, supabase])

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
