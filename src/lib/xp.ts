import { LEVEL_THRESHOLDS, MAX_LEVEL, XP_REWARDS } from '../constants/xp'

export function getLevelFromXp(totalXp: number): number {
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (totalXp >= LEVEL_THRESHOLDS[i]) return i + 1
  }
  return 1
}

export function getXpProgress(totalXp: number): {
  level: number
  current: number
  required: number
  percentage: number
} {
  const level = getLevelFromXp(totalXp)
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, current: 0, required: 0, percentage: 100 }
  }
  const floorXp = LEVEL_THRESHOLDS[level - 1]
  const ceilXp = LEVEL_THRESHOLDS[level]
  const current = totalXp - floorXp
  const required = ceilXp - floorXp
  return {
    level,
    current,
    required,
    percentage: Math.min(100, Math.floor((current / required) * 100)),
  }
}

export function calcStudyXp(
  hours: number,
  questionsTotal: number,
  questionsCorrect: number
): number {
  let xp = Math.round(hours * XP_REWARDS.STUDY_PER_HOUR)
  xp += questionsCorrect * XP_REWARDS.STUDY_PER_CORRECT
  const accuracy = questionsTotal > 0 ? questionsCorrect / questionsTotal : 0
  if (accuracy === 1 && questionsTotal > 0) {
    xp += XP_REWARDS.STUDY_ACCURACY_100
  } else if (accuracy >= 0.8 && questionsTotal > 0) {
    xp += XP_REWARDS.STUDY_ACCURACY_80
  }
  return xp
}

export function calcFinanceXp(
  type: 'income' | 'expense' | 'savings' | 'investment',
  value: number,
  currentBalance: number
): number {
  if (type === 'savings') return XP_REWARDS.FINANCE_SAVINGS
  if (type === 'investment') return XP_REWARDS.FINANCE_INVESTMENT
  if (type === 'income') return XP_REWARDS.FINANCE_INCOME
  // expense — check overspend
  if (currentBalance > 0 && value / currentBalance > 0.3) {
    return XP_REWARDS.FINANCE_OVERSPEND
  }
  return 0
}

export function getLevelTitle(level: number): string {
  if (level <= 5) return 'Iniciante'
  if (level <= 10) return 'Aprendiz'
  if (level <= 15) return 'Aventureiro'
  if (level <= 20) return 'Explorador'
  if (level <= 25) return 'Guerreiro'
  if (level <= 30) return 'Campeão'
  if (level <= 35) return 'Herói'
  if (level <= 40) return 'Elite'
  if (level <= 45) return 'Mestre'
  return 'Lendário'
}

export function getLevelColor(level: number): string {
  if (level <= 10) return '#94a3b8'
  if (level <= 20) return '#10b981'
  if (level <= 30) return '#3b82f6'
  if (level <= 40) return '#a855f7'
  return '#f59e0b'
}
