import { useState } from 'react'
import { Plus, Trash2, DollarSign, TrendingUp, TrendingDown, PiggyBank, Landmark, AlertTriangle, type LucideProps } from 'lucide-react'
import { useActivePlayer } from '../../store/useAppStore'
import { useFinanceStore } from '../../store/useFinanceStore'
import { calcFinanceXp } from '../../lib/xp'
import { todayKey, formatDate, formatCurrency } from '../../lib/dateUtils'
import type { TransactionType } from '../../types'
import type { ForwardRefExoticComponent, RefAttributes } from 'react'
import { Modal } from '../shared/Modal'

type LucideIcon = ForwardRefExoticComponent<Omit<LucideProps, 'ref'> & RefAttributes<SVGSVGElement>>

const TYPE_CONFIG: Record<TransactionType, { label: string; color: string; icon: LucideIcon }> = {
  income: { label: 'Receita', color: '#10b981', icon: TrendingUp },
  expense: { label: 'Despesa', color: '#ef4444', icon: TrendingDown },
  savings: { label: 'Poupança', color: '#3b82f6', icon: PiggyBank },
  investment: { label: 'Investimento', color: '#a855f7', icon: Landmark },
}

export function FinancePage() {
  const player = useActivePlayer()
  const getPlayerTransactions = useFinanceStore((s) => s.getPlayerTransactions)
  const addTransaction = useFinanceStore((s) => s.addTransaction)
  const deleteTransaction = useFinanceStore((s) => s.deleteTransaction)
  const getCurrentBalance = useFinanceStore((s) => s.getCurrentBalance)

  const [date, setDate] = useState(todayKey())
  const [description, setDescription] = useState('')
  const [type, setType] = useState<TransactionType>('income')
  const [value, setValue] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (!player) return null

  const transactions = getPlayerTransactions(player.id)
  const balance = getCurrentBalance(player.id)
  const valueNum = parseFloat(value) || 0
  const xpPreview = calcFinanceXp(type, valueNum, balance)

  const income = transactions.filter((t) => t.type === 'income').reduce((a, t) => a + t.value, 0)
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((a, t) => a + t.value, 0)
  const savings = transactions.filter((t) => t.type === 'savings').reduce((a, t) => a + t.value, 0)
  const investments = transactions.filter((t) => t.type === 'investment').reduce((a, t) => a + t.value, 0)

  const lastExpense = transactions.find((t) => t.type === 'expense')
  const showOverspendWarning = lastExpense && lastExpense.xpEffect < 0

  const txToDelete = transactions.find((t) => t.id === deleteId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!description.trim()) return setError('Informe a descrição')
    if (valueNum <= 0) return setError('Valor deve ser maior que 0')
    setError('')
    addTransaction(player!.id, {
      date,
      description: description.trim(),
      type,
      value: valueNum,
    })
    setDescription('')
    setValue('')
    setDate(todayKey())
    setShowForm(false)
  }

  function confirmDelete() {
    if (deleteId) deleteTransaction(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="module-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Finanças</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Registrar
        </button>
      </div>

      {/* Balance card */}
      <div className={`card mb-4 text-center border-2 ${balance >= 0 ? 'border-success/30' : 'border-danger/30'}`}>
        <div className="text-text-muted text-sm mb-1">Saldo Atual</div>
        <div className={`text-4xl font-black ${balance >= 0 ? 'text-success' : 'text-danger'}`}>
          {formatCurrency(balance)}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Receitas', value: income, color: '#10b981' },
          { label: 'Despesas', value: expenses, color: '#ef4444' },
          { label: 'Poupança', value: savings, color: '#3b82f6' },
          { label: 'Investimentos', value: investments, color: '#a855f7' },
        ].map(({ label, value: v, color }) => (
          <div key={label} className="card">
            <div className="text-text-muted text-xs mb-1">{label}</div>
            <div className="font-black text-sm" style={{ color }}>{formatCurrency(v)}</div>
          </div>
        ))}
      </div>

      {/* Overspend warning */}
      {showOverspendWarning && (
        <div className="mb-4 bg-danger/10 border border-danger/30 rounded-xl px-4 py-3 flex items-center gap-3 text-sm text-danger">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Última despesa superou 30% do saldo — penalidade de XP aplicada!</span>
        </div>
      )}

      {/* Add form */}
      {showForm && (
        <div className="card mb-6 border-primary/30">
          <h2 className="font-bold text-text mb-4 flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-primary-light" />
            Nova Transação
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Valor (R$)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0,00"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  min="0.01"
                  step="0.01"
                />
              </div>
            </div>
            <div>
              <label className="label">Descrição</label>
              <input
                className="input"
                placeholder="Ex: Supermercado, Salário, Poupança mensal..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={80}
              />
            </div>
            <div>
              <label className="label">Tipo</label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.entries(TYPE_CONFIG) as [TransactionType, typeof TYPE_CONFIG[TransactionType]][]).map(([t, cfg]) => {
                  const Icon = cfg.icon
                  return (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setType(t)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all text-sm font-medium ${
                        type === t ? 'border-opacity-80' : 'border-border text-text-muted hover:border-border/80'
                      }`}
                      style={type === t ? { borderColor: cfg.color, backgroundColor: `${cfg.color}15`, color: cfg.color } : {}}
                    >
                      <Icon className="w-4 h-4" />
                      {cfg.label}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* XP preview */}
            {valueNum > 0 && (
              <div className={`rounded-lg px-4 py-2 flex items-center justify-between text-sm ${
                xpPreview >= 0 ? 'bg-accent/10 border border-accent/30' : 'bg-danger/10 border border-danger/30'
              }`}>
                <span className="text-text-muted">
                  {xpPreview < 0 ? '⚠️ Penalidade de XP:' : 'XP que será ganho:'}
                </span>
                <span className={`font-black ${xpPreview >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {xpPreview >= 0 ? '+' : ''}{xpPreview} XP
                </span>
              </div>
            )}

            {error && <p className="text-danger text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions list */}
      {transactions.length === 0 ? (
        <div className="card text-center py-12 text-text-muted">
          <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma transação registrada.</p>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-bold text-text mb-4">Extrato</h2>
          <div className="space-y-2">
            {transactions.map((tx) => {
              const cfg = TYPE_CONFIG[tx.type]
              const Icon = cfg.icon
              return (
                <div key={tx.id} className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: `${cfg.color}20` }}
                  >
                    <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-text truncate">{tx.description}</div>
                    <div className="text-xs text-text-muted">{formatDate(tx.date)} · {cfg.label}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-bold text-sm" style={{ color: cfg.color }}>
                      {tx.type === 'expense' ? '-' : '+'}{formatCurrency(tx.value)}
                    </div>
                    {tx.xpEffect !== 0 && (
                      <div className={`text-xs font-medium ${tx.xpEffect > 0 ? 'text-accent' : 'text-danger'}`}>
                        {tx.xpEffect > 0 ? '+' : ''}{tx.xpEffect} XP
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => setDeleteId(tx.id)}
                    className="p-1 rounded hover:bg-danger/20 text-text-muted hover:text-danger transition-colors shrink-0"
                    title="Excluir lançamento"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && txToDelete && (
        <Modal title="Excluir Lançamento" onClose={() => setDeleteId(null)} size="sm">
          <p className="text-text-muted mb-2">
            Tem certeza que deseja excluir o lançamento:
          </p>
          <p className="font-bold text-text mb-5">
            "{txToDelete.description}" — {formatCurrency(txToDelete.value)}
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleteId(null)}>
              Cancelar
            </button>
            <button className="btn-danger flex-1" onClick={confirmDelete}>
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
