'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Plus, 
  Minus, 
  Loader2,
  Search,
  Filter,
  Calendar,
  ArrowLeft,
  Trash2,
  CreditCard,
  Pencil,
  X,
  Check
} from 'lucide-react'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { formatCurrency } from '@/lib/utils'
import Link from 'next/link'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense'
  txn_date: string
  note: string | null
  created_at: string
  payment_method: 'cash' | 'credit' | null
  is_credit: boolean
  categories: {
    name: string
    type: string
  } | null
  accounts: {
    name: string
  } | null
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all')
  const [currency, setCurrency] = useState('JPY')
  const [editingTxn, setEditingTxn] = useState<Transaction | null>(null)
  const [editAmount, setEditAmount] = useState('')
  const [editNote, setEditNote] = useState('')
  const [editDate, setEditDate] = useState('')
  const [saving, setSaving] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    loadTransactions()
  }, [])

  const loadTransactions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data: member } = await supabase
      .from('household_members')
      .select('household_id, households(currency)')
      .eq('profile_id', user.id)
      .single()

    if (!member) {
      setLoading(false)
      return
    }

    setCurrency(member.households?.currency || 'JPY')

    const { data: txns } = await supabase
      .from('transactions')
      .select(`
        *,
        categories(name, type),
        accounts!inner(name, household_id)
      `)
      .eq('accounts.household_id', member.household_id)
      .order('txn_date', { ascending: false })
      .order('created_at', { ascending: false })

    if (txns) {
      setTransactions(txns)
    }
    setLoading(false)
  }

  const deleteTransaction = async (id: string) => {
    if (!confirm('Delete this transaction?')) return

    await supabase
      .from('transactions')
      .delete()
      .eq('id', id)

    loadTransactions()
  }

  const openEditDialog = (txn: Transaction) => {
    setEditingTxn(txn)
    setEditAmount(Math.abs(txn.amount).toString())
    setEditNote(txn.note || '')
    setEditDate(txn.txn_date)
  }

  const saveEdit = async () => {
    if (!editingTxn) return
    setSaving(true)

    await supabase
      .from('transactions')
      .update({
        amount: parseFloat(editAmount),
        note: editNote || null,
        txn_date: editDate
      })
      .eq('id', editingTxn.id)

    setSaving(false)
    setEditingTxn(null)
    loadTransactions()
  }

  const filteredTransactions = transactions.filter(txn => {
    const matchesSearch = 
      txn.note?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      txn.categories?.name?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesType = filterType === 'all' || txn.type === filterType

    return matchesSearch && matchesType
  })

  // Group transactions by date
  const groupedTransactions = filteredTransactions.reduce((groups, txn) => {
    const date = txn.txn_date
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(txn)
    return groups
  }, {} as Record<string, Transaction[]>)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateStr === today.toISOString().split('T')[0]) {
      return 'Today'
    } else if (dateStr === yesterday.toISOString().split('T')[0]) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('ja-JP', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short'
      })
    }
  }

  const getDayTotal = (txns: Transaction[]) => {
    const income = txns.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0)
    const expense = txns.filter(t => t.type === 'expense').reduce((sum, t) => sum + Math.abs(t.amount), 0)
    return { income, expense }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-success" />
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
            className="lg:hidden"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl lg:text-2xl font-bold text-navy-900">Transaction History</h1>
        </div>
        <Link href="/quick-input">
          <Button size="sm" className="bg-success hover:bg-success/90 text-white">
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </Link>
      </div>

      {/* Search & Filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search transactions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-10"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex bg-gray-100 rounded-lg p-1">
        {(['all', 'income', 'expense'] as const).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={cn(
              'flex-1 py-2 text-sm font-medium rounded-md transition-all capitalize',
              filterType === type
                ? 'bg-white shadow-sm text-navy-900'
                : 'text-gray-500'
            )}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      {Object.keys(groupedTransactions).length === 0 ? (
        <Card className="border border-gray-200">
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">No transactions found</p>
            <Link href="/quick-input">
              <Button className="mt-4 bg-success hover:bg-success/90">
                Add Your First Transaction
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedTransactions).map(([date, txns]) => {
            const { income, expense } = getDayTotal(txns)
            return (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-sm font-medium text-gray-600">{formatDate(date)}</p>
                  <div className="flex gap-3 text-xs">
                    {income > 0 && (
                      <span className="text-success">+{formatCurrency(income, currency)}</span>
                    )}
                    {expense > 0 && (
                      <span className="text-red-500">-{formatCurrency(expense, currency)}</span>
                    )}
                  </div>
                </div>

                {/* Transactions */}
                <Card className="border border-gray-200">
                  <CardContent className="p-0 divide-y divide-gray-100">
                    {txns.map((txn) => (
                      <div 
                        key={txn.id}
                        className="flex items-center justify-between p-4 hover:bg-gray-50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center relative",
                            txn.type === 'income' ? 'bg-success/10' : 'bg-red-50'
                          )}>
                            {txn.type === 'income' ? (
                              <Plus className="h-5 w-5 text-success" />
                            ) : (
                              <Minus className="h-5 w-5 text-red-500" />
                            )}
                            {txn.is_credit && (
                              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center">
                                <CreditCard className="h-3 w-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-navy-900">
                                {txn.categories?.name || txn.note || 'Transaction'}
                              </p>
                              {txn.is_credit && (
                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded">Debt</span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">
                              {txn.accounts?.name}
                              {txn.note && txn.categories?.name && ` • ${txn.note}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <p className={cn(
                            "font-semibold",
                            txn.type === 'income' ? 'text-success' : 'text-red-500'
                          )}>
                            {txn.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(txn.amount), currency)}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => openEditDialog(txn)}
                            className="h-8 w-8 text-gray-400 hover:text-blue-500"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteTransaction(txn.id)}
                            className="h-8 w-8 text-gray-400 hover:text-red-500"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingTxn} onOpenChange={(open) => !open && setEditingTxn(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Transaction</DialogTitle>
          </DialogHeader>
          {editingTxn && (
            <div className="space-y-4 pt-2">
              <div>
                <Label className="text-sm text-gray-500">Category</Label>
                <p className="font-medium text-navy-900 mt-1">
                  {editingTxn.categories?.name || 'Uncategorized'}
                </p>
              </div>

              <div>
                <Label className="text-sm text-gray-500">Amount (¥)</Label>
                <Input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-500">Date</Label>
                <Input
                  type="date"
                  value={editDate}
                  onChange={(e) => setEditDate(e.target.value)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label className="text-sm text-gray-500">Note</Label>
                <Input
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Add a note..."
                  className="mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setEditingTxn(null)}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={saveEdit}
                  disabled={saving || !editAmount}
                  className="flex-1 bg-success hover:bg-success/90"
                >
                  {saving ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Save
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
