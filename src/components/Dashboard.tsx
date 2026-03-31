import { CheckCircle, BookOpen, DollarSign, Timer, Zap, TrendingUp } from 'lucide-react'
import { useActivePlayer, useAppStore } from '../store/useAppStore'
import { useHabitsStore } from '../store/useHabitsStore'
import { useStudyStore } from '../store/useStudyStore'
import { useFinanceStore } from '../store/useFinanceStore'
import { usePomodoroStore } from '../store/usePomodoroStore'
import { Avatar } from './shared/Avatar'
import { XpBar } from './shared/XpBar'
import { formatCurrency, formatDateTime, todayKey } from '../lib/dateUtils'

export function Dashboard() {
  const player = useActivePlayer()
  const xpEvents = useAppStore((s) => s.xpEvents)
  const habits = useHabitsStore((s) => s.habits)
  const getTodayEntries = useHabitsStore((s) => s.getTodayEntries)
  const getPlayerSessions = useStudyStore((s) => s.getPlayerSessions)
  const getCurrentBalance = useFinanceStore((s) => s.getCurrentBalance)
  const pomodoroSessions = usePomodoroStore((s) => s.sessions)

  if (!player) return null

  const today = todayKey()
  const todayEntries = getTodayEntries(player.id)
  const habitsCompleted = todayEntries.filter((e) => e.completed).length
  const playerHabits = habits.filter((h) => h.playerId === player.id)

  const studySessions = getPlayerSessions(player.id)
  const todayStudy = studySessions.filter((s) => s.date === today)
  const todayHours = todayStudy.reduce((acc, s) => acc + s.hours, 0)

  const balance = getCurrentBalance(player.id)

  const todayPomodoro = pomodoroSessions.filter(
    (s) => s.playerId === player.id && s.date === today
  )
  const todayCycles = todayPomodoro.reduce((acc, s) => acc + s.completedCycles, 0)

  const recentEvents = xpEvents
    .filter((e) => e.playerId === player.id)
    .slice(-8)
    .reverse()

  const stats = [
    {
      label: 'Hábitos Hoje',
      value: `${habitsCompleted}/${playerHabits.length}`,
      icon: CheckCircle,
      color: '#10b981',
      sub: habitsCompleted === playerHabits.length && playerHabits.length > 0 ? 'Completo! 🎉' : 'Continue assim!',
    },
    {
      label: 'Horas de Estudo',
      value: todayHours.toFixed(1) + 'h',
      icon: BookOpen,
      color: '#3b82f6',
      sub: `${studySessions.length} sessões totais`,
    },
    {
      label: 'Saldo Atual',
      value: formatCurrency(balance),
      icon: DollarSign,
      color: balance >= 0 ? '#10b981' : '#ef4444',
      sub: balance >= 0 ? 'Finanças saudáveis' : 'Atenção às despesas',
    },
    {
      label: 'Ciclos Pomodoro',
      value: String(todayCycles),
      icon: Timer,
      color: '#a855f7',
      sub: `Hoje`,
    },
  ]

  return (
    <div className="module-page">
      {/* Player header */}
      <div className="card mb-6 flex items-center gap-6 flex-wrap">
        <Avatar photoUrl={player.photoUrl} nickname={player.nickname} size="xl" />
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black text-text mb-0.5">{player.nickname}</h1>
          {player.realName && <p className="text-text-muted mb-3">{player.realName}</p>}
          <XpBar xp={player.xp} showDetails />
        </div>
        <div className="text-right shrink-0">
          <div className="text-text-muted text-xs">XP Total</div>
          <div className="text-3xl font-black text-accent">{player.xp.toLocaleString()}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {stats.map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-text-muted text-xs font-medium">{label}</span>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-2xl font-black text-text">{value}</div>
            <div className="text-xs text-text-dim">{sub}</div>
          </div>
        ))}
      </div>

      {/* Recent XP events */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-4 h-4 text-accent" />
          <h2 className="font-bold text-text">Atividade Recente</h2>
        </div>
        {recentEvents.length === 0 ? (
          <p className="text-text-muted text-sm text-center py-4">
            Nenhuma atividade ainda. Complete hábitos, estude ou registre finanças!
          </p>
        ) : (
          <div className="space-y-2">
            {recentEvents.map((ev) => (
              <div key={ev.id} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                <div className="flex items-center gap-3">
                  <TrendingUp className={`w-4 h-4 ${ev.amount >= 0 ? 'text-accent' : 'text-danger'}`} />
                  <div>
                    <div className="text-sm text-text">{ev.description}</div>
                    <div className="text-xs text-text-dim">{formatDateTime(ev.timestamp)}</div>
                  </div>
                </div>
                <span className={`font-bold text-sm ${ev.amount >= 0 ? 'text-accent' : 'text-danger'}`}>
                  {ev.amount >= 0 ? '+' : ''}{ev.amount} XP
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
