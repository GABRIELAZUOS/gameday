import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Transaction, TransactionType } from '../types'
import { calcFinanceXp } from '../lib/xp'
import { useAppStore } from './useAppStore'

interface FinanceState {
  transactions: Transaction[]
  addTransaction: (
    playerId: string,
    data: { date: string; description: string; type: TransactionType; value: number }
  ) => void
  deleteTransaction: (id: string) => void
  getPlayerTransactions: (playerId: string) => Transaction[]
  getCurrentBalance: (playerId: string) => number
}

export const useFinanceStore = create<FinanceState>()(
  persist(
    (set, get) => ({
      transactions: [],

      addTransaction: (playerId, data) => {
        const currentBalance = get().getCurrentBalance(playerId)
        const xpEffect = calcFinanceXp(data.type, data.value, currentBalance)
        const sign = data.type === 'expense' ? -1 : 1
        const balanceAfter = currentBalance + sign * data.value

        const tx: Transaction = {
          id: uuid(),
          playerId,
          balanceAfter,
          xpEffect,
          createdAt: new Date().toISOString(),
          ...data,
        }
        set((s) => ({ transactions: [...s.transactions, tx] }))

        const source =
          data.type === 'savings'
            ? 'finance_savings'
            : data.type === 'investment'
            ? 'finance_investment'
            : data.type === 'income'
            ? 'finance_income'
            : 'finance_overspend'

        if (xpEffect !== 0) {
          useAppStore
            .getState()
            .awardXp(
              playerId,
              xpEffect,
              source,
              xpEffect > 0
                ? `Financeiro: ${data.description}`
                : `Gasto excessivo: ${data.description}`
            )
        }
      },

      deleteTransaction: (id) =>
        set((s) => ({ transactions: s.transactions.filter((t) => t.id !== id) })),

      getPlayerTransactions: (playerId) =>
        get()
          .transactions.filter((t) => t.playerId === playerId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),

      getCurrentBalance: (playerId) => {
        const txs = get().transactions.filter((t) => t.playerId === playerId)
        return txs.reduce((acc, t) => {
          return acc + (t.type === 'expense' ? -t.value : t.value)
        }, 0)
      },
    }),
    { name: 'gameday:finance' }
  )
)
