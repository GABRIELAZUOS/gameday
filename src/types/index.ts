export interface Player {
  id: string
  nickname: string
  photoUrl: string | null
  realName: string
  xp: number
  level: number
  createdAt: string
  passwordHash?: string
}

export interface Habit {
  id: string
  playerId: string
  name: string
  icon: string
  xpReward: number
  isDefault: boolean
  order: number
}

export interface HabitEntry {
  id: string
  habitId: string
  playerId: string
  dateKey: string
  completed: boolean
  completedAt: string | null
}

export interface HabitStreak {
  habitId: string
  playerId: string
  currentStreak: number
  longestStreak: number
  lastCompletedDate: string | null
}

export interface WaterReminderConfig {
  enabled: boolean
  intervalMinutes: number
}

export interface StudySession {
  id: string
  playerId: string
  date: string
  subject: string
  hours: number
  questionsTotal: number
  questionsCorrect: number
  questionsWrong: number
  xpEarned: number
  createdAt: string
}

export type TransactionType = 'income' | 'expense' | 'savings' | 'investment'

export interface Transaction {
  id: string
  playerId: string
  date: string
  description: string
  type: TransactionType
  value: number
  balanceAfter: number
  xpEffect: number
  createdAt: string
}

export type PomodoroPhase = 'work' | 'shortBreak' | 'longBreak' | 'idle'

export interface PomodoroConfig {
  workMinutes: number
  shortBreakMinutes: number
  longBreakMinutes: number
  cyclesBeforeLongBreak: number
}

export interface PomodoroSession {
  id: string
  playerId: string
  date: string
  completedCycles: number
  xpEarned: number
  createdAt: string
}

export type XpSource =
  | 'habit'
  | 'habit_streak'
  | 'habit_all_done'
  | 'study_hours'
  | 'study_correct'
  | 'study_accuracy'
  | 'finance_savings'
  | 'finance_investment'
  | 'finance_income'
  | 'finance_overspend'
  | 'pomodoro_cycle'
  | 'pomodoro_set'

export interface XpEvent {
  id: string
  playerId: string
  source: XpSource
  amount: number
  description: string
  timestamp: string
}

export interface ToastItem {
  id: string
  amount: number
  description: string
  isPositive: boolean
}
