import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Player, XpEvent, XpSource, ToastItem } from '../types'
import { getLevelFromXp } from '../lib/xp'

interface AppState {
  players: Player[]
  activePlayerId: string | null
  xpEvents: XpEvent[]
  toastQueue: ToastItem[]
  levelUpPlayerId: string | null

  addPlayer: (data: Omit<Player, 'id' | 'xp' | 'level' | 'createdAt'>) => Player
  updatePlayer: (id: string, data: Partial<Omit<Player, 'id'>>) => void
  deletePlayer: (id: string) => void
  setActivePlayer: (id: string | null) => void
  awardXp: (playerId: string, amount: number, source: XpSource, description: string) => void
  dismissLevelUp: () => void
  pushToast: (toast: ToastItem) => void
  dismissToast: (id: string) => void
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      players: [],
      activePlayerId: null,
      xpEvents: [],
      toastQueue: [],
      levelUpPlayerId: null,

      addPlayer: (data) => {
        const player: Player = {
          id: uuid(),
          xp: 0,
          level: 1,
          createdAt: new Date().toISOString(),
          ...data,
        }
        set((s) => ({ players: [...s.players, player] }))
        return player
      },

      updatePlayer: (id, data) =>
        set((s) => ({
          players: s.players.map((p) => (p.id === id ? { ...p, ...data } : p)),
        })),

      deletePlayer: (id) =>
        set((s) => ({
          players: s.players.filter((p) => p.id !== id),
          activePlayerId: s.activePlayerId === id ? null : s.activePlayerId,
        })),

      setActivePlayer: (id) => set({ activePlayerId: id }),

      awardXp: (playerId, amount, source, description) => {
        const event: XpEvent = {
          id: uuid(),
          playerId,
          source,
          amount,
          description,
          timestamp: new Date().toISOString(),
        }
        const players = get().players
        const player = players.find((p) => p.id === playerId)
        if (!player) return

        const prevLevel = player.level
        const newXp = Math.max(0, player.xp + amount)
        const newLevel = getLevelFromXp(newXp)

        set((s) => ({
          players: s.players.map((p) =>
            p.id === playerId ? { ...p, xp: newXp, level: newLevel } : p
          ),
          xpEvents: [...s.xpEvents.slice(-199), event],
          levelUpPlayerId: newLevel > prevLevel ? playerId : s.levelUpPlayerId,
        }))

        // Show toast
        const toast: ToastItem = {
          id: uuid(),
          amount,
          description,
          isPositive: amount >= 0,
        }
        set((s) => ({ toastQueue: [...s.toastQueue, toast] }))
      },

      dismissLevelUp: () => set({ levelUpPlayerId: null }),

      pushToast: (toast) =>
        set((s) => ({ toastQueue: [...s.toastQueue, toast] })),

      dismissToast: (id) =>
        set((s) => ({ toastQueue: s.toastQueue.filter((t) => t.id !== id) })),
    }),
    {
      name: 'gameday:app',
      partialize: (s) => ({ players: s.players, activePlayerId: s.activePlayerId, xpEvents: s.xpEvents }),
    }
  )
)

export const useActivePlayer = () => {
  const players = useAppStore((s) => s.players)
  const id = useAppStore((s) => s.activePlayerId)
  return players.find((p) => p.id === id) ?? null
}
