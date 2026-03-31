import { useState, useEffect, useRef } from 'react'
import { Bell, BellOff } from 'lucide-react'
import { useActivePlayer } from '../../store/useAppStore'
import { useHabitsStore } from '../../store/useHabitsStore'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate()
}

// dateKey for a specific day in the selected month/year
function makeDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function HabitsPage() {
  const player = useActivePlayer()
  const habits = useHabitsStore((s) => s.habits)
  const entries = useHabitsStore((s) => s.entries)
  const completeHabit = useHabitsStore((s) => s.completeHabit)
  const uncompleteHabit = useHabitsStore((s) => s.uncompleteHabit)
  const renameHabit = useHabitsStore((s) => s.renameHabit)
  const waterConfig = useHabitsStore((s) => s.waterConfig)
  const setWaterConfig = useHabitsStore((s) => s.setWaterConfig)

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear] = useState(now.getFullYear())

  const [editingHabitId, setEditingHabitId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [waterAlert, setWaterAlert] = useState(false)
  const waterIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const todayKey = now.toISOString().slice(0, 10)

  if (!player) return null

  const playerHabits = habits
    .filter((h) => h.playerId === player.id)
    .sort((a, b) => a.order - b.order)

  const numDays = daysInMonth(selectedYear, selectedMonth)

  // Build a set of completed (habitId, dateKey)
  const completedSet = new Set(
    entries
      .filter((e) => e.playerId === player.id && e.completed)
      .map((e) => `${e.habitId}::${e.dateKey}`)
  )

  function isCompleted(habitId: string, day: number): boolean {
    return completedSet.has(`${habitId}::${makeDateKey(selectedYear, selectedMonth, day)}`)
  }

  function toggleDay(habitId: string, day: number) {
    const dateKey = makeDateKey(selectedYear, selectedMonth, day)
    const done = completedSet.has(`${habitId}::${dateKey}`)
    // Only allow toggling today or past days
    if (dateKey > todayKey) return
    if (done) {
      uncompleteHabit(habitId, player!.id, dateKey)
    } else {
      completeHabit(habitId, player!.id, dateKey)
    }
  }

  function getHabitTotal(habitId: string): number {
    let count = 0
    for (let d = 1; d <= numDays; d++) {
      if (isCompleted(habitId, d)) count++
    }
    return count
  }

  // Inline edit
  function startEdit(id: string, name: string) {
    setEditingHabitId(id)
    setEditingName(name)
  }

  function saveEdit(id: string) {
    if (editingName.trim()) renameHabit(id, editingName.trim())
    setEditingHabitId(null)
  }

  // Water reminder
  useEffect(() => {
    if (waterConfig.enabled) {
      waterIntervalRef.current = setInterval(() => {
        setWaterAlert(true)
        setTimeout(() => setWaterAlert(false), 6000)
      }, waterConfig.intervalMinutes * 60 * 1000)
    }
    return () => { if (waterIntervalRef.current) clearInterval(waterIntervalRef.current) }
  }, [waterConfig.enabled, waterConfig.intervalMinutes])

  const daysArray = Array.from({ length: numDays }, (_, i) => i + 1)

  return (
    <div className="module-page max-w-none">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text">
            🤍 Hábitos Diários — {MONTHS[selectedMonth - 1]} {selectedYear}
          </h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Month selector */}
          <select
            className="input py-1.5 w-36 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>

          {/* Water reminder */}
          <div className="flex items-center gap-2 card py-2 px-3">
            {waterConfig.enabled ? (
              <Bell className="w-4 h-4 text-info shrink-0" />
            ) : (
              <BellOff className="w-4 h-4 text-text-muted shrink-0" />
            )}
            <select
              className="bg-transparent text-xs text-text-muted outline-none w-28"
              value={waterConfig.intervalMinutes}
              onChange={(e) => setWaterConfig({ intervalMinutes: Number(e.target.value) })}
            >
              {[15, 20, 30, 45, 60].map((m) => (
                <option key={m} value={m}>Água: {m}min</option>
              ))}
            </select>
            <button
              onClick={() => setWaterConfig({ enabled: !waterConfig.enabled })}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
                waterConfig.enabled ? 'bg-info' : 'bg-border'
              }`}
            >
              <span
                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${
                  waterConfig.enabled ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Water alert */}
      {waterAlert && (
        <div className="mb-4 bg-info/20 border border-info/30 text-info rounded-xl px-4 py-3 flex items-center gap-3 text-sm font-medium">
          💧 Hora de tomar água! Lembre-se: 2 litros por dia.
          <button className="ml-auto text-xs underline" onClick={() => setWaterAlert(false)}>Dispensar</button>
        </div>
      )}

      {/* Grid table */}
      <div className="card p-0 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left px-4 py-3 font-semibold text-text-muted min-w-[160px] sticky left-0 bg-card z-10">
                Hábito
              </th>
              {daysArray.map((d) => {
                const dk = makeDateKey(selectedYear, selectedMonth, d)
                const isToday = dk === todayKey
                const isFuture = dk > todayKey
                return (
                  <th
                    key={d}
                    className={`text-center font-semibold w-7 py-3 ${
                      isToday ? 'text-primary-light' : isFuture ? 'text-text-dim' : 'text-text-muted'
                    }`}
                  >
                    {d}
                  </th>
                )
              })}
              <th className="text-center px-3 py-3 font-semibold text-text-muted min-w-[60px]">Total</th>
              <th className="text-center px-2 py-3 font-semibold text-text-muted min-w-[50px]">%</th>
            </tr>
          </thead>
          <tbody>
            {playerHabits.map((habit, rowIdx) => {
              const total = getHabitTotal(habit.id)
              const pct = numDays > 0 ? Math.round((total / numDays) * 100) : 0
              const pctColor = pct >= 70 ? 'text-success' : 'text-danger'

              return (
                <tr
                  key={habit.id}
                  className={`border-b border-border/40 last:border-0 ${rowIdx % 2 === 0 ? '' : 'bg-surface/30'}`}
                >
                  {/* Habit name — inline edit */}
                  <td className="px-4 py-2 sticky left-0 bg-inherit z-10" style={{ backgroundColor: rowIdx % 2 === 0 ? '#16213e' : '#16213ecc' }}>
                    {editingHabitId === habit.id ? (
                      <input
                        className="input py-1 text-xs w-full"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onBlur={() => saveEdit(habit.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEdit(habit.id)
                          if (e.key === 'Escape') setEditingHabitId(null)
                        }}
                        autoFocus
                        maxLength={60}
                      />
                    ) : (
                      <span
                        className="text-text text-xs font-medium cursor-pointer hover:text-primary-light transition-colors"
                        onClick={() => startEdit(habit.id, habit.name)}
                        title="Clique para editar o nome"
                      >
                        {habit.name}
                      </span>
                    )}
                  </td>

                  {/* Day cells */}
                  {daysArray.map((d) => {
                    const dk = makeDateKey(selectedYear, selectedMonth, d)
                    const done = isCompleted(habit.id, d)
                    const isFuture = dk > todayKey
                    return (
                      <td key={d} className="text-center py-2">
                        <button
                          onClick={() => toggleDay(habit.id, d)}
                          disabled={isFuture}
                          className={`w-5 h-5 rounded transition-all mx-auto block ${
                            isFuture
                              ? 'bg-border/20 cursor-not-allowed'
                              : done
                              ? 'bg-success hover:bg-success/80'
                              : 'bg-border/40 hover:bg-border'
                          }`}
                          title={isFuture ? 'Dia futuro' : done ? 'Desmarcar' : 'Marcar'}
                        >
                          {done && (
                            <svg viewBox="0 0 10 10" className="w-full h-full p-0.5">
                              <path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </button>
                      </td>
                    )
                  })}

                  {/* Total */}
                  <td className="text-center px-3 py-2 font-bold text-text">
                    {total}/{numDays}
                  </td>

                  {/* % */}
                  <td className={`text-center px-2 py-2 font-bold ${pctColor}`}>
                    {pct}%
                  </td>
                </tr>
              )
            })}

            {playerHabits.length === 0 && (
              <tr>
                <td colSpan={numDays + 3} className="text-center py-8 text-text-muted">
                  Nenhum hábito encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-xs text-text-muted flex-wrap">
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-success" />
          Concluído
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-border/40" />
          Não concluído
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-4 h-4 rounded bg-border/20" />
          Dia futuro
        </div>
        <span className="text-success">Verde ≥ 70%</span>
        <span className="text-danger">Vermelho &lt; 70%</span>
        <span className="text-text-dim">· Clique no nome do hábito para renomear</span>
      </div>
    </div>
  )
}
