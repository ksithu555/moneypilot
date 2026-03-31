import { formatCurrency, formatDate } from '@/lib/utils'
import { ArrowDownLeft, ArrowUpRight, ArrowLeftRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Transaction {
  id: string
  amount: number
  type: 'income' | 'expense' | 'transfer'
  txn_date: string
  note: string | null
  payee: string | null
  categories: { name: string; color: string } | null
  accounts: { name: string } | null
}

interface RecentTransactionsProps {
  transactions: Transaction[]
  currency: string
}

export function RecentTransactions({ transactions, currency }: RecentTransactionsProps) {
  if (transactions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <ArrowLeftRight className="h-12 w-12 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">No transactions yet</p>
        <p className="text-xs text-muted-foreground">Add your first transaction</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {transactions.map((transaction) => {
        const Icon = transaction.type === 'income' ? ArrowDownLeft : 
                     transaction.type === 'expense' ? ArrowUpRight : ArrowLeftRight
        
        return (
          <div key={transaction.id} className="flex items-center gap-4">
            <div className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              transaction.type === 'income' ? 'bg-success/10 text-success' :
              transaction.type === 'expense' ? 'bg-destructive/10 text-destructive' :
              'bg-muted text-muted-foreground'
            )}>
              <Icon className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {transaction.payee || transaction.note || transaction.categories?.name || 'Transaction'}
              </p>
              <p className="text-xs text-muted-foreground">
                {transaction.accounts?.name} • {formatDate(transaction.txn_date)}
              </p>
            </div>
            <div className={cn(
              'text-sm font-medium',
              transaction.type === 'income' ? 'text-success' : 
              transaction.type === 'expense' ? 'text-destructive' : ''
            )}>
              {transaction.type === 'income' ? '+' : transaction.type === 'expense' ? '-' : ''}
              {formatCurrency(Math.abs(transaction.amount), currency)}
            </div>
          </div>
        )
      })}
    </div>
  )
}
