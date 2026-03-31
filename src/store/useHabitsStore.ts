import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Habit, HabitEntry, HabitStreak, WaterReminderConfig } from '../types'
import { DEFAULT_HABITS } from '../constants/habits'
import { XP_REWARDS } from '../constants/xp'
import { todayKey } from '../lib/dateUtils'
import { useAppStore } from './useAppStore'

interface HabitsState {
  habits: Habit[]
  entries: HabitEntry[]
  streaks: HabitStreak[]
  waterConfig: WaterReminderConfig

  initHabitsForPlayer: (playerId: string) => void
  // dateKey is optional — defaults to today. Pass a specific date for grid editing.
  completeHabit: (habitId: string, playerId: string, dateKey?: string) => void
  uncompleteHabit: (habitId: string, playerId: string, dateKey?: string) => void
  renameHabit: (habitId: string, name: string) => void
  setWaterConfig: (config: Partial<WaterReminderConfig>) => void
  getTodayEntries: (playerId: string) => HabitEntry[]
  getStreak: (habitId: string, playerId: string) => HabitStreak
  resetDailyEntries: () => void
}

export const useHabitsStore = create<HabitsState>()(
  persist(
    (set, get) => ({
      habits: [],
      entries: [],
      streaks: [],
      waterConfig: { enabled: false, intervalMinutes: 30 },

      initHabitsForPlayer: (playerId) => {
        const existing = get().habits.filter((h) => h.playerId === playerId)
        if (existing.length > 0) return
        const newHabits: Habit[] = DEFAULT_HABITS.map((h) => ({
          id: `${playerId}-${h.id}`,
          playerId,
          name: h.name,
          icon: h.icon,
          xpReward: XP_REWARDS.HABIT,
          isDefault: true,
          order: h.order,
        }))
        set((s) => ({ habits: [...s.habits, ...newHabits] }))
      },

      completeHabit: (habitId, playerId, dateKey) => {
        const date = dateKey ?? todayKey()
        const existing = get().entries.find(
          (e) => e.habitId === habitId && e.playerId === playerId && e.dateKey === date
        )
        if (existing?.completed) return

        const entry: HabitEntry = {
          id: uuid(),
          habitId,
          playerId,
          dateKey: date,
          completed: true,
          completedAt: new Date().toISOString(),
        }

        set((s) => {
          const filtered = s.entries.filter(
            (e) => !(e.habitId === habitId && e.playerId === playerId && e.dateKey === date)
          )
          return { entries: [...filtered, entry] }
        })

        // Only update streak and award XP if toggling today
        const today = todayKey()
        if (date === today) {
          const streak = get().getStreak(habitId, playerId)
          const yesterday = new Date()
          yesterday.setDate(yesterday.getDate() - 1)
          const yesterdayKey = yesterday.toISOString().slice(0, 10)
          const newStreak =
            streak.lastCompletedDate === yesterdayKey || streak.lastCompletedDate === date
              ? streak.currentStreak + (streak.lastCompletedDate === date ? 0 : 1)
              : 1

          set((s) => ({
            streaks: [
              ...s.streaks.filter((st) => !(st.habitId === habitId && st.playerId === playerId)),
              {
                habitId,
                playerId,
                currentStreak: newStreak,
                longestStreak: Math.max(newStreak, streak.longestStreak),
                lastCompletedDate: date,
              },
            ],
          }))

          const awardXp = useAppStore.getState().awardXp
          awardXp(playerId, XP_REWARDS.HABIT, 'habit', `Hábito concluído`)

          if (newStreak > 0 && newStreak % 7 === 0) {
            const bonus = XP_REWARDS.HABIT_STREAK_7 * (newStreak / 7)
            awardXp(playerId, bonus, 'habit_streak', `Bônus de sequência (${newStreak} dias)!`)
          }

          const playerHabits = get().habits.filter((h) => h.playerId === playerId)
          const todayCompleted = get().entries.filter(
            (e) => e.playerId === playerId && e.dateKey === date && e.completed
          )
          if (todayCompleted.length === playerHabits.length) {
            awardXp(playerId, XP_REWARDS.HABIT_ALL_DONE, 'habit_all_done', 'Todos os hábitos do dia! 🎉')
          }
        }
      },

      uncompleteHabit: (habitId, playerId, dateKey) => {
        const date = dateKey ?? todayKey()
        set((s) => ({
          entries: s.entries.map((e) =>
            e.habitId === habitId && e.playerId === playerId && e.dateKey === date
              ? { ...e, completed: false, completedAt: null }
              : e
          ),
        }))
      },

      renameHabit: (habitId, name) =>
        set((s) => ({
          habits: s.habits.map((h) => (h.id === habitId ? { ...h, name } : h)),
        })),

      setWaterConfig: (config) =>
        set((s) => ({ waterConfig: { ...s.waterConfig, ...config } })),

      getTodayEntries: (playerId) => {
        const date = todayKey()
        return get().entries.filter((e) => e.playerId === playerId && e.dateKey === date)
      },

      getStreak: (habitId, playerId) => {
        return (
          get().streaks.find((s) => s.habitId === habitId && s.playerId === playerId) ?? {
            habitId,
            playerId,
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,
          }
        )
      },

      resetDailyEntries: () => {
        // entries persist in history
      },
    }),
    { name: 'gameday:habits' }
  )
)
