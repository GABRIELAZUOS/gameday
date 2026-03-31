import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { PomodoroConfig, PomodoroPhase, PomodoroSession } from '../types'
import { XP_REWARDS } from '../constants/xp'
import { todayKey } from '../lib/dateUtils'
import { useAppStore } from './useAppStore'

interface PomodoroTimerState {
  phase: PomodoroPhase
  secondsRemaining: number
  cycleCount: number
  isRunning: boolean
}

interface PomodoroState {
  config: PomodoroConfig
  timer: PomodoroTimerState
  sessions: PomodoroSession[]

  updateConfig: (c: Partial<PomodoroConfig>) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tick: () => void
  skipPhase: (playerId: string) => void
  completePhase: (playerId: string) => void
}

const DEFAULT_CONFIG: PomodoroConfig = {
  workMinutes: 25,
  shortBreakMinutes: 5,
  longBreakMinutes: 15,
  cyclesBeforeLongBreak: 4,
}

function phaseSeconds(phase: PomodoroPhase, config: PomodoroConfig): number {
  if (phase === 'work') return config.workMinutes * 60
  if (phase === 'shortBreak') return config.shortBreakMinutes * 60
  if (phase === 'longBreak') return config.longBreakMinutes * 60
  return config.workMinutes * 60
}

export const usePomodoroStore = create<PomodoroState>()(
  persist(
    (set, get) => ({
      config: DEFAULT_CONFIG,
      timer: {
        phase: 'idle',
        secondsRemaining: DEFAULT_CONFIG.workMinutes * 60,
        cycleCount: 0,
        isRunning: false,
      },
      sessions: [],

      updateConfig: (c) =>
        set((s) => {
          const newConfig = { ...s.config, ...c }
          return {
            config: newConfig,
            timer: {
              ...s.timer,
              secondsRemaining: phaseSeconds(s.timer.phase === 'idle' ? 'work' : s.timer.phase, newConfig),
              isRunning: false,
            },
          }
        }),

      startTimer: () =>
        set((s) => ({
          timer: {
            ...s.timer,
            phase: s.timer.phase === 'idle' ? 'work' : s.timer.phase,
            isRunning: true,
            secondsRemaining:
              s.timer.phase === 'idle'
                ? s.config.workMinutes * 60
                : s.timer.secondsRemaining,
          },
        })),

      pauseTimer: () =>
        set((s) => ({ timer: { ...s.timer, isRunning: false } })),

      resetTimer: () =>
        set((s) => ({
          timer: {
            phase: 'idle',
            secondsRemaining: s.config.workMinutes * 60,
            cycleCount: 0,
            isRunning: false,
          },
        })),

      tick: () => {
        const { timer } = get()
        if (!timer.isRunning) return
        if (timer.secondsRemaining > 1) {
          set((s) => ({
            timer: { ...s.timer, secondsRemaining: s.timer.secondsRemaining - 1 },
          }))
        }
      },

      skipPhase: (playerId) => {
        get().completePhase(playerId)
      },

      completePhase: (playerId) => {
        const { timer, config, sessions } = get()
        const awardXp = useAppStore.getState().awardXp

        if (timer.phase === 'work') {
          // Completed a work cycle
          const newCycleCount = timer.cycleCount + 1
          awardXp(playerId, XP_REWARDS.POMODORO_CYCLE, 'pomodoro_cycle', `Ciclo Pomodoro #${newCycleCount} concluído!`)

          // Upsert session
          const date = todayKey()
          const existing = sessions.find((s) => s.playerId === playerId && s.date === date)
          if (existing) {
            const isSet = newCycleCount % config.cyclesBeforeLongBreak === 0
            const bonus = isSet ? XP_REWARDS.POMODORO_SET : 0
            set((s) => ({
              sessions: s.sessions.map((sess) =>
                sess.id === existing.id
                  ? {
                      ...sess,
                      completedCycles: sess.completedCycles + 1,
                      xpEarned: sess.xpEarned + XP_REWARDS.POMODORO_CYCLE + bonus,
                    }
                  : sess
              ),
            }))
            if (isSet) {
              awardXp(playerId, XP_REWARDS.POMODORO_SET, 'pomodoro_set', `Sequência de ${config.cyclesBeforeLongBreak} ciclos! 🔥`)
            }
          } else {
            set((s) => ({
              sessions: [
                ...s.sessions,
                {
                  id: uuid(),
                  playerId,
                  date,
                  completedCycles: 1,
                  xpEarned: XP_REWARDS.POMODORO_CYCLE,
                  createdAt: new Date().toISOString(),
                },
              ],
            }))
          }

          // Move to break
          const isLongBreak = newCycleCount % config.cyclesBeforeLongBreak === 0
          const nextPhase: PomodoroPhase = isLongBreak ? 'longBreak' : 'shortBreak'
          set((s) => ({
            timer: {
              phase: nextPhase,
              secondsRemaining: phaseSeconds(nextPhase, s.config),
              cycleCount: newCycleCount,
              isRunning: false,
            },
          }))
        } else {
          // Break ended — back to work
          set((s) => ({
            timer: {
              ...s.timer,
              phase: 'work',
              secondsRemaining: phaseSeconds('work', s.config),
              isRunning: false,
            },
          }))
        }
      },
    }),
    {
      name: 'gameday:pomodoro',
      partialize: (s) => ({ config: s.config, sessions: s.sessions }),
    }
  )
)
