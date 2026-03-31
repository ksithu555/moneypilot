'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { TrendingUp, TrendingDown, PiggyBank, CreditCard } from 'lucide-react'
import { startOfMonth, endOfMonth, format } from 'date-fns'

export function MonthlyStats() {
  const [stats, setStats] = useState({
    monthlyIncome: 0,
    monthlyExpenses: 0,
    monthlySavings: 0,
    monthlyDebt: 0,
  })
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    async function fetchStats() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const now = new Date()
      const monthStart = format(startOfMonth(now), 'yyyy-MM-dd')
      const monthEnd = format(endOfMonth(now), 'yyyy-MM-dd')

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('created_by', user.id)
        .gte('txn_date', monthStart)
        .lte('txn_date', monthEnd)

      if (transactions) {
        const monthlyIncome = transactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + t.amount, 0)

        const monthlyExpenses = transactions
          .filter(t => t.type === 'expense')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        const monthlySavings = transactions
          .filter(t => t.type === 'expense' && t.categories?.name?.toLowerCase().includes('saving'))
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        const monthlyDebt = transactions
          .filter(t => t.is_credit === true)
          .reduce((sum, t) => sum + Math.abs(t.amount), 0)

        setStats({ monthlyIncome, monthlyExpenses, monthlySavings, monthlyDebt })
      }
      setLoading(false)
    }

    fetchStats()
  }, [supabase])

  const currency = 'JPY'

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <Card key={i} className="border border-gray-200 animate-pulse">
            <CardContent className="p-4">
              <div className="h-16 bg-gray-100 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <Card className="border border-gray-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs lg:text-sm text-gray-500">Monthly Income</p>
            <p className="text-lg lg:text-xl font-bold text-success">{formatCurrency(stats.monthlyIncome, currency)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs lg:text-sm text-gray-500">Monthly Expenses</p>
            <p className="text-lg lg:text-xl font-bold text-red-500">{formatCurrency(stats.monthlyExpenses, currency)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <TrendingDown className="w-5 h-5 text-red-500" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs lg:text-sm text-gray-500">Monthly Savings</p>
            <p className="text-lg lg:text-xl font-bold text-success">{formatCurrency(stats.monthlySavings, currency)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
            <PiggyBank className="w-5 h-5 text-success" />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-gray-200">
        <CardContent className="p-4 flex items-center justify-between">
          <div>
            <p className="text-xs lg:text-sm text-gray-500">Credit Card Debt</p>
            <p className="text-lg lg:text-xl font-bold text-red-500">{formatCurrency(stats.monthlyDebt, currency)}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-red-500" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
