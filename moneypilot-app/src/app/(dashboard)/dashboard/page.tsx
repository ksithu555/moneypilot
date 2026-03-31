import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { formatCurrency } from '@/lib/utils'
import { CashflowChart } from '@/components/charts/cashflow-chart'
import { CategoryBreakdown } from '@/components/charts/category-breakdown'
import { GoalsProgress } from '@/components/dashboard/goals-progress'
import { RecentTransactions } from '@/components/dashboard/recent-transactions'
import { AiInsightsCard } from '@/components/dashboard/ai-insights-card'
import { TrendingUp, TrendingDown, Wallet, Target, ArrowUpRight, Eye, EyeOff, PiggyBank, CreditCard } from 'lucide-react'
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

  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('household_id', householdId)

  const { data: transactions } = await supabase
    .from('transactions')
    .select('*, categories(*), accounts(*)')
    .eq('accounts.household_id', householdId)
    .order('txn_date', { ascending: false })
    .limit(10)

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

  const totalAssets = accounts?.filter(a => ['checking', 'savings', 'cash', 'investment'].includes(a.type))
    .reduce((sum, a) => sum + (a.balance || 0), 0) || 0
  
  const totalLiabilities = accounts?.filter(a => ['credit', 'loan'].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(a.balance || 0), 0) || 0

  const netWorth = totalAssets - totalLiabilities

  const thisMonthTransactions = transactions?.filter(t => {
    const txnDate = new Date(t.txn_date)
    const now = new Date()
    return txnDate.getMonth() === now.getMonth() && txnDate.getFullYear() === now.getFullYear()
  }) || []

  const monthlyIncome = thisMonthTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)

  const monthlyExpenses = thisMonthTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // Monthly savings (expenses with category name containing 'saving')
  const monthlySavings = thisMonthTransactions
    .filter(t => t.type === 'expense' && t.categories?.name?.toLowerCase().includes('saving'))
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  // Monthly debt (credit card expenses)
  const monthlyDebt = thisMonthTransactions
    .filter(t => t.is_credit === true)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)

  const currency = accounts?.[0]?.currency || 'JPY'

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
                  <span className="text-2xl lg:text-3xl font-bold">{formatCurrency(netWorth, currency)}</span>
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

        {/* Quick Stats - Horizontal scroll on mobile */}
        <div className="flex lg:flex-col gap-3 lg:gap-4 overflow-x-auto pb-2 lg:pb-0 -mx-4 px-4 lg:mx-0 lg:px-0">
          <Card className="border border-gray-200 min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">Monthly Income</p>
                  <p className="text-lg lg:text-2xl font-bold text-success mt-1">{formatCurrency(monthlyIncome, currency)}</p>
                </div>
                <div className="w-10 h-10 bg-success/10 rounded-full flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-success" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">Monthly Expenses</p>
                  <p className="text-lg lg:text-2xl font-bold text-red-500 mt-1">{formatCurrency(monthlyExpenses, currency)}</p>
                </div>
                <div className="w-10 h-10 bg-red-50 rounded-full flex items-center justify-center">
                  <TrendingDown className="h-5 w-5 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">Monthly Savings</p>
                  <p className="text-lg lg:text-2xl font-bold text-emerald-600 mt-1">{formatCurrency(monthlySavings, currency)}</p>
                </div>
                <div className="w-10 h-10 bg-emerald-50 rounded-full flex items-center justify-center">
                  <PiggyBank className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border border-gray-200 min-w-[160px] lg:min-w-0 flex-shrink-0 lg:flex-shrink">
            <CardContent className="p-4 lg:p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs lg:text-sm text-gray-500">Credit Card Debt</p>
                  <p className="text-lg lg:text-2xl font-bold text-orange-500 mt-1">{formatCurrency(monthlyDebt, currency)}</p>
                </div>
                <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center">
                  <CreditCard className="h-5 w-5 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
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
            <CashflowChart householdId={householdId} />
          </CardContent>
        </Card>

        <Card className="lg:col-span-3 border border-gray-200">
          <CardHeader className="p-4 lg:p-6 pb-2">
            <CardTitle className="text-base lg:text-lg font-semibold text-navy-900">Spending by Category</CardTitle>
            <p className="text-xs lg:text-sm text-gray-500">This month's breakdown</p>
          </CardHeader>
          <CardContent>
            <CategoryBreakdown householdId={householdId} />
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
