import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CashflowChart } from '@/components/charts/cashflow-chart'
import { CategoryBreakdown } from '@/components/charts/category-breakdown'
import { GoalsProgress } from '@/components/dashboard/goals-progress'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { AiInsightsCard } from '@/components/dashboard/ai-insights-card'
import { ArrowUpRight, Eye } from 'lucide-react'
import { MonthlyStats } from '@/components/dashboard/monthly-stats'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  
  const { data: member } = await supabase
    .from('household_members')
    .select('household_id, profiles(display_name)')
    .eq('profile_id', user?.id)
    .single()

  const householdId = member?.household_id
  const displayName = (member as any)?.profiles?.display_name || user?.email?.split('@')[0] || 'User'

  // Get all transactions for this month (no limit for accurate monthly totals)
  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(*)')
    .eq('created_by', user?.id)
    .order('txn_date', { ascending: false })

  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('household_id', householdId)

  const { data: insights } = await supabase
    .from('ai_insights')
    .select('*')
    .eq('household_id', householdId)
    .order('generated_at', { ascending: false })
    .limit(1)
    .single()

  // Calculate totals from transactions
  const totalIncome = (transactions as any[])?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0) || 0
  
  const totalExpenses = (transactions as any[])?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0

  const netBalance = totalIncome - totalExpenses
  const currency = 'JPY'

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Welcome back, {displayName}!</h1>
          <p className="text-sm lg:text-base text-gray-500">Track and manage your finances.</p>
        </div>
        <Link href="/dashboard/transactions">
          <Button className="bg-success hover:bg-success/90 text-white w-full sm:w-auto">
            Add Transaction
          </Button>
        </Link>
      </div>

      {/* Main Balance Card */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 bg-gradient-to-br from-navy-900 to-navy-950 text-white border-0">
          <CardContent className="p-4 lg:p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-400 text-sm">Total Net Worth</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-2xl lg:text-3xl font-bold">{formatCurrency(netBalance, currency)}</span>
                  <span className="text-success text-sm flex items-center">
                    <ArrowUpRight className="h-4 w-4" />
                    +2.4%
                  </span>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                <Eye className="h-5 w-5" />
              </Button>
            </div>
            
            {/* Mini Chart */}
            <div className="flex items-end gap-1 lg:gap-1.5 h-20 lg:h-24 mt-4 lg:mt-6">
              {[35, 55, 40, 70, 50, 85, 60, 75, 45, 90, 65, 80].map((height, i) => (
                <div 
                  key={i}
                  className="flex-1 bg-success/30 rounded-t transition-all hover:bg-success/50"
                  style={{ height: `${height}%` }}
                />
              ))}
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-2">
              <span>Jan</span>
              <span>Jun</span>
              <span>Dec</span>
            </div>

            <div className="flex items-center gap-4 mt-6 pt-4 border-t border-navy-800">
              <Link href="/dashboard/accounts" className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
                View Accounts <ArrowUpRight className="h-3 w-3" />
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats - Client component for accurate monthly data */}
        <MonthlyStats />
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-7">
        <Card className="lg:col-span-4 border border-gray-200">
          <CardHeader className="p-4 lg:p-6 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base lg:text-lg font-semibold text-navy-900">Cashflow</CardTitle>
              <Button variant="ghost" size="sm" className="text-success text-xs lg:text-sm">
                Adjust
              </Button>
            </div>
            <p className="text-xs lg:text-sm text-gray-500">Income vs expenses over time</p>
          </CardHeader>
          <CardContent>
            <CashflowChart />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-gray-200">
          <CardHeader className="p-4 lg:p-6 pb-2">
            <CardTitle className="text-base lg:text-lg font-semibold text-navy-900">Spending by Category</CardTitle>
            <p className="text-xs lg:text-sm text-gray-500">This month's breakdown</p>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown />
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 lg:gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2 border border-gray-200">
          <CardHeader className="p-4 lg:p-6 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base lg:text-lg font-semibold text-navy-900">Recent Transactions</CardTitle>
              <Link href="/dashboard/transactions">
                <Button variant="ghost" size="sm" className="text-success">
                  View All
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            <RecentTransactions transactions={transactions || []} currency={currency} />
          </CardContent>
        </Card>

        <Card className="border border-gray-200">
          <CardHeader className="p-4 lg:p-6 pb-2">
            <CardTitle className="text-base lg:text-lg font-semibold text-navy-900">Goals Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <GoalsProgress goals={goals || []} currency={currency} />
          </CardContent>
        </Card>
      </div>

      <AiInsightsCard insights={insights} />
    </div>
  )
}
