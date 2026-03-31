import { Navigate, Route, Routes } from 'react-router-dom'
import { useAppStore } from './store/useAppStore'
import { PlayerSelect } from './components/players/PlayerSelect'
import { AppShell } from './components/layout/AppShell'
import { Dashboard } from './components/Dashboard'
import { HabitsPage } from './components/habits/HabitsPage'
import { StudyPage } from './components/study/StudyPage'
import { FinancePage } from './components/finance/FinancePage'
import { PomodoroPage } from './components/pomodoro/PomodoroPage'
import { LeaderboardPage } from './components/leaderboard/LeaderboardPage'
import { SportsPage } from './components/sports/SportsPage'

export function App() {
  const activePlayerId = useAppStore((s) => s.activePlayerId)

  if (!activePlayerId) {
    return <PlayerSelect />
  }

  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/habits" element={<HabitsPage />} />
        <Route path="/study" element={<StudyPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="/pomodoro" element={<PomodoroPage />} />
        <Route path="/sports" element={<SportsPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Route>
    </Routes>
  )
}
