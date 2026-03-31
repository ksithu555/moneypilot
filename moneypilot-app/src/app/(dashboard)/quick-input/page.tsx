'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Plus, 
  Minus, 
  Loader2, 
  Check,
  Wallet,
  ShoppingBag,
  Coffee,
  Car,
  Home,
  Utensils,
  Zap,
  Heart,
  Film,
  CreditCard,
  TrendingUp,
  Gift,
  MoreHorizontal,
  Calendar,
  Clock,
  History,
  Banknote,
  PiggyBank
} from 'lucide-react'
import { cn } from '@/lib/utils'

const expenseCategories = [
  { id: 'daily', name: 'Daily', icon: Coffee, color: '#ef4444' },
  { id: 'food', name: 'Food', icon: Utensils, color: '#f59e0b' },
  { id: 'shopping', name: 'Shopping', icon: ShoppingBag, color: '#ec4899' },
  { id: 'transport', name: 'Transport', icon: Car, color: '#3b82f6' },
  { id: 'housing', name: 'Housing', icon: Home, color: '#8b5cf6' },
  { id: 'utilities', name: 'Utilities', icon: Zap, color: '#06b6d4' },
  { id: 'health', name: 'Health', icon: Heart, color: '#14b8a6' },
  { id: 'entertainment', name: 'Fun', icon: Film, color: '#f97316' },
  { id: 'savings', name: 'Savings', icon: PiggyBank, color: '#10b981' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: '#6b7280' },
]

const paymentMethods = [
  { id: 'cash', name: 'Cash/Bank', icon: Banknote, color: '#10b981' },
  { id: 'credit', name: 'Credit Card', icon: CreditCard, color: '#ef4444' },
]

const incomeCategories = [
  { id: 'salary', name: 'Salary', icon: Wallet, color: '#10b981' },
  { id: 'bonus', name: 'Bonus', icon: Gift, color: '#22c55e' },
  { id: 'investment', name: 'Investment', icon: TrendingUp, color: '#8b5cf6' },
  { id: 'other', name: 'Other', icon: MoreHorizontal, color: '#6b7280' },
]

export default function QuickInputPage() {
  const [type, setType] = useState<'expense' | 'income'>('expense')
  const [amount, setAmount] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [selectedTime, setSelectedTime] = useState(new Date().toTimeString().slice(0, 5))
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash')
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: member } = await supabase
      .from('household_members')
      .select('household_id')
      .eq('profile_id', user.id)
      .single()

    if (!member) return

    const { data: categoriesData } = await supabase
      .from('categories')
      .select('*')
      .eq('household_id', member.household_id)

    if (categoriesData) {
      setCategories(categoriesData)
    }

    // Load recent transactions
    const { data: recentTxns } = await supabase
      .from('transactions')
      .select('*, categories(name, type)')
      .eq('created_by', user.id)
      .order('txn_date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentTxns) {
      setRecentTransactions(recentTxns)
    }
  }

  const handleSubmit = async () => {
    if (!amount || !selectedCategory) return

    setLoading(true)
    setErrorMsg(null)

    const { data: { user } } = await supabase.auth.getUser()
    
    if (!user) {
      setLoading(false)
      setErrorMsg('Please log in to add transactions')
      return
    }

    // Find the matching category from database
    const categoryName = type === 'expense' 
      ? expenseCategories.find(c => c.id === selectedCategory)?.name
      : incomeCategories.find(c => c.id === selectedCategory)?.name
    
    const dbCategory = categories.find(c => 
      c.name.toLowerCase().includes(categoryName?.toLowerCase() || '') && c.type === type
    )

    // Determine if this is a credit card expense (adds to debt)
    const isCredit = type === 'expense' && paymentMethod === 'credit'

    const insertData = {
      category_id: dbCategory?.id || null,
      amount: parseFloat(amount),
      type: type,
      txn_date: selectedDate,
      note: note || categoryName || null,
      created_by: user.id,
      payment_method: type === 'expense' ? paymentMethod : null,
      is_credit: isCredit
    }

    console.log('Inserting transaction:', insertData)

    const { data, error } = await supabase
      .from('transactions')
      .insert(insertData)
      .select()

    console.log('Insert result:', { data, error })

    setLoading(false)

    if (error) {
      console.error('Insert error:', error)
      setErrorMsg(error.message || 'Failed to save transaction')
    } else {
      setSuccess(true)
      // Reload recent transactions
      loadData()
      setTimeout(() => {
        setSuccess(false)
        setAmount('')
        setNote('')
        setSelectedCategory(null)
        setPaymentMethod('cash')
      }, 1500)
    }
  }

  const currentCategories = type === 'expense' ? expenseCategories : incomeCategories

  const formatAmount = (value: string) => {
    const num = parseInt(value.replace(/,/g, '')) || 0
    return num.toLocaleString('ja-JP')
  }

  const handleAmountChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setAmount(numericValue)
  }

  return (
    <div className="max-w-lg mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Today's Input</h1>
        <p className="text-sm text-gray-500 mt-1">Quick add your income or expense</p>
      </div>

      {/* Type Toggle */}
      <div className="flex bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setType('expense')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all',
            type === 'expense' 
              ? 'bg-white text-red-500 shadow-sm' 
              : 'text-gray-500'
          )}
        >
          <Minus className="h-4 w-4" />
          Expense
        </button>
        <button
          onClick={() => setType('income')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-medium transition-all',
            type === 'income' 
              ? 'bg-white text-success shadow-sm' 
              : 'text-gray-500'
          )}
        >
          <Plus className="h-4 w-4" />
          Income
        </button>
      </div>

      {/* Amount Input */}
      <Card className="border-2 border-gray-200">
        <CardContent className="p-6">
          <div className="text-center">
            <Label className="text-sm text-gray-500">Amount</Label>
            <div className="flex items-center justify-center gap-2 mt-2">
              <span className="text-2xl text-gray-400">¥</span>
              <input
                type="text"
                inputMode="numeric"
                value={formatAmount(amount)}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0"
                className={cn(
                  "text-4xl lg:text-5xl font-bold text-center bg-transparent border-none outline-none w-full",
                  type === 'expense' ? 'text-red-500' : 'text-success'
                )}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Category Selection */}
      <div>
        <Label className="text-sm text-gray-500 mb-3 block">Category</Label>
        <div className="grid grid-cols-5 gap-2">
          {currentCategories.map((category) => {
            const Icon = category.icon
            const isSelected = selectedCategory === category.id
            return (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={cn(
                  'flex flex-col items-center gap-1 p-3 rounded-xl transition-all',
                  isSelected 
                    ? 'bg-navy-900 text-white' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
              >
                <Icon className="h-5 w-5" style={{ color: isSelected ? 'white' : category.color }} />
                <span className="text-xs">{category.name}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Payment Method Selection (only for expenses) */}
      {type === 'expense' && (
        <div>
          <Label className="text-sm text-gray-500 mb-3 block">Paid By</Label>
          <div className="grid grid-cols-2 gap-3">
            {paymentMethods.map((method) => {
              const Icon = method.icon
              const isSelected = paymentMethod === method.id
              return (
                <button
                  key={method.id}
                  onClick={() => setPaymentMethod(method.id as 'cash' | 'credit')}
                  className={cn(
                    'flex items-center justify-center gap-2 p-4 rounded-xl transition-all border-2',
                    isSelected 
                      ? method.id === 'credit'
                        ? 'bg-red-50 border-red-500 text-red-600'
                        : 'bg-success/10 border-success text-success'
                      : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{method.name}</span>
                  {isSelected && method.id === 'credit' && (
                    <span className="text-xs bg-red-500 text-white px-2 py-0.5 rounded-full">+Debt</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Date & Time Selection */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-1">
            <Calendar className="h-3 w-3" /> Date
          </Label>
          <Input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="h-11"
          />
        </div>
        <div>
          <Label className="text-sm text-gray-500 mb-2 block flex items-center gap-1">
            <Clock className="h-3 w-3" /> Time
          </Label>
          <Input
            type="time"
            value={selectedTime}
            onChange={(e) => setSelectedTime(e.target.value)}
            className="h-11"
          />
        </div>
      </div>

      {/* Note Input */}
      <div>
        <Label className="text-sm text-gray-500 mb-2 block">Note (optional)</Label>
        <Input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What was this for?"
          className="h-12"
        />
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg text-sm">
          {errorMsg}
        </div>
      )}

      {/* Submit Button */}
      <Button
        onClick={handleSubmit}
        disabled={!amount || !selectedCategory || loading}
        className={cn(
          'w-full h-14 text-lg font-medium',
          type === 'expense' 
            ? 'bg-red-500 hover:bg-red-600' 
            : 'bg-success hover:bg-success/90'
        )}
      >
        {loading ? (
          <Loader2 className="h-5 w-5 animate-spin" />
        ) : success ? (
          <>
            <Check className="h-5 w-5 mr-2" />
            Saved!
          </>
        ) : (
          <>
            {type === 'expense' ? 'Add Expense' : 'Add Income'}
          </>
        )}
      </Button>

      {/* Recent Transactions */}
      {recentTransactions.length > 0 && (
        <div className="pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <Label className="text-sm text-gray-500 flex items-center gap-1">
              <History className="h-3 w-3" /> Recent
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/dashboard/transactions')}
              className="text-success text-xs"
            >
              View All
            </Button>
          </div>
          <div className="space-y-2">
            {recentTransactions.map((txn) => (
              <div 
                key={txn.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center relative",
                    txn.type === 'income' ? 'bg-success/10' : 'bg-red-50'
                  )}>
                    {txn.type === 'income' ? (
                      <Plus className="h-4 w-4 text-success" />
                    ) : (
                      <Minus className="h-4 w-4 text-red-500" />
                    )}
                    {txn.is_credit && (
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                        <CreditCard className="h-2.5 w-2.5 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <p className="text-sm font-medium text-navy-900">
                        {txn.categories?.name || txn.note || 'Transaction'}
                      </p>
                      {txn.is_credit && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded">Debt</span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500">{txn.txn_date}</p>
                  </div>
                </div>
                <p className={cn(
                  "font-semibold",
                  txn.type === 'income' ? 'text-success' : 'text-red-500'
                )}>
                  {txn.type === 'income' ? '+' : '-'}¥{Math.abs(txn.amount).toLocaleString('ja-JP')}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="flex justify-center gap-4 pt-4">
        <Button
          variant="ghost"
          onClick={() => router.push('/dashboard')}
          className="text-gray-500"
        >
          Go to Dashboard
        </Button>
      </div>
    </div>
  )
}
