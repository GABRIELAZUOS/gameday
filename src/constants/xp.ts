// XP needed to go from level N to N+1 = 50 * N * (N + 1)
// Total XP to reach level N (cumulative from level 1) stored in LEVEL_THRESHOLDS
// LEVEL_THRESHOLDS[0] = 0  → you start at level 1
// LEVEL_THRESHOLDS[1] = 100 → need 100 total XP to be level 2
// LEVEL_THRESHOLDS[N-1] = total XP needed to BE at level N

export const MAX_LEVEL = 50

function buildThresholds(): number[] {
  const thresholds: number[] = [0]
  for (let n = 1; n < MAX_LEVEL; n++) {
    const xpForThisLevel = 50 * n * (n + 1)
    thresholds.push(thresholds[n - 1] + xpForThisLevel)
  }
  return thresholds
}

export const LEVEL_THRESHOLDS = buildThresholds()

// XP rewards
export const XP_REWARDS = {
  HABIT: 10,
  HABIT_STREAK_7: 25,
  HABIT_ALL_DONE: 30,
  STUDY_PER_HOUR: 20,
  STUDY_PER_CORRECT: 2,
  STUDY_ACCURACY_80: 15,
  STUDY_ACCURACY_100: 25,
  FINANCE_SAVINGS: 20,
  FINANCE_INVESTMENT: 30,
  FINANCE_INCOME: 5,
  FINANCE_OVERSPEND: -15,
  POMODORO_CYCLE: 15,
  POMODORO_SET: 20,
} as const

export const OVERSPEND_THRESHOLD = 0.3 // 30% of balance
