import { useState } from 'react'
import { Plus, Trash2, Bike } from 'lucide-react'
import { useActivePlayer } from '../../store/useAppStore'
import { useSportsStore, type SportType, type SportIntensity } from '../../store/useSportsStore'
import { Modal } from '../shared/Modal'
import { formatDate } from '../../lib/dateUtils'

const MONTHS = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro',
]

const GOALS = {
  workouts: 16,
  bike: 200,
  run: 30,
  gym: 12, // treinos de academia por mês
}

const SPORT_CONFIG: Record<SportType, { emoji: string; color: string; label: string }> = {
  Bicicleta: { emoji: '🚴', color: '#3b82f6', label: 'Bicicleta' },
  Corrida:   { emoji: '🏃', color: '#10b981', label: 'Corrida' },
  Academia:  { emoji: '🏋️', color: '#a855f7', label: 'Academia' },
}

// Format pace as "X:XX min/km" — only for Corrida and Bicicleta
function formatPace(paceMinPerKm: number): string {
  if (!paceMinPerKm || paceMinPerKm === 0) return '—'
  const mins = Math.floor(paceMinPerKm)
  const secs = Math.round((paceMinPerKm - mins) * 60)
  return `${mins}:${secs.toString().padStart(2, '0')} min/km`
}

function ProgressBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  return (
    <div className="h-1.5 bg-border rounded-full overflow-hidden mt-2">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  )
}

export function SportsPage() {
  const player = useActivePlayer()
  const addWorkout = useSportsStore((s) => s.addWorkout)
  const deleteWorkout = useSportsStore((s) => s.deleteWorkout)
  const getPlayerWorkouts = useSportsStore((s) => s.getPlayerWorkouts)

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear] = useState(now.getFullYear())

  const [showForm, setShowForm] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Form state
  const todayStr = now.toISOString().slice(0, 10)
  const [date, setDate] = useState(todayStr)
  const [type, setType] = useState<SportType>('Corrida')
  const [distanceStr, setDistanceStr] = useState('')
  const [durationStr, setDurationStr] = useState('')
  const [intensity, setIntensity] = useState<SportIntensity>('Moderada')
  const [formMonth, setFormMonth] = useState(now.getMonth() + 1)
  const [objective, setObjective] = useState('')
  const [formError, setFormError] = useState('')

  if (!player) return null

  const workouts = getPlayerWorkouts(player.id, selectedMonth, selectedYear)

  // Stats
  const totalWorkouts = workouts.length
  const bikeKm   = workouts.filter((w) => w.type === 'Bicicleta').reduce((a, w) => a + w.distanceKm, 0)
  const runKm    = workouts.filter((w) => w.type === 'Corrida').reduce((a, w) => a + w.distanceKm, 0)
  const gymCount = workouts.filter((w) => w.type === 'Academia').length

  // Best pace per type (lowest = best); Academia has no pace
  const bikePaces = workouts.filter((w) => w.type === 'Bicicleta' && w.paceMinPerKm > 0).map((w) => w.paceMinPerKm)
  const runPaces  = workouts.filter((w) => w.type === 'Corrida'   && w.paceMinPerKm > 0).map((w) => w.paceMinPerKm)
  const bestBikePace = bikePaces.length ? Math.min(...bikePaces) : 0
  const bestRunPace  = runPaces.length  ? Math.min(...runPaces)  : 0

  const workoutToDelete = workouts.find((w) => w.id === deleteId)

  // Academia doesn't require distance
  const isGym = type === 'Academia'

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const duration = parseInt(durationStr)
    if (!durationStr || isNaN(duration) || duration <= 0) return setFormError('Tempo inválido')

    if (!isGym) {
      const distance = parseFloat(distanceStr)
      if (!distanceStr || isNaN(distance) || distance <= 0) return setFormError('Distância inválida')
    }
    setFormError('')

    const distance = isGym ? 0 : parseFloat(distanceStr)
    const [y] = date.split('-').map(Number)
    addWorkout(player!.id, {
      date,
      month: formMonth,
      year: y || selectedYear,
      type,
      distanceKm: distance,
      durationMin: duration,
      intensity,
      objective: objective.trim(),
    })
    setDistanceStr('')
    setDurationStr('')
    setObjective('')
    setDate(todayStr)
    setFormMonth(now.getMonth() + 1)
    setShowForm(false)
  }

  function confirmDelete() {
    if (deleteId) deleteWorkout(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="module-page">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="page-title mb-0">🏅 Esportes</h1>
          <p className="text-text-muted text-sm">Registro de treinos de corrida, bicicleta e academia</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            className="input py-1.5 w-36 text-sm"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => (
              <option key={i} value={i + 1}>{m}</option>
            ))}
          </select>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Novo Treino
          </button>
        </div>
      </div>

      {/* Summary cards — 5 cards: Treinos, Bicicleta, Corrida, Academia, Melhor Pace */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
        <div className="card">
          <div className="text-text-muted text-xs mb-1">Treinos</div>
          <div className="text-2xl font-black text-text">{totalWorkouts}</div>
          <div className="text-xs text-text-dim">Meta: {GOALS.workouts}</div>
          <ProgressBar value={totalWorkouts} max={GOALS.workouts} color="#7c3aed" />
        </div>

        <div className="card">
          <div className="flex items-center gap-1 text-text-muted text-xs mb-1">
            <Bike className="w-3 h-3" /> Bicicleta
          </div>
          <div className="text-2xl font-black text-text">{bikeKm.toFixed(1)} km</div>
          <div className="text-xs text-text-dim">Meta: {GOALS.bike} km</div>
          <ProgressBar value={bikeKm} max={GOALS.bike} color="#3b82f6" />
        </div>

        <div className="card">
          <div className="text-text-muted text-xs mb-1">🏃 Corrida</div>
          <div className="text-2xl font-black text-text">{runKm.toFixed(1)} km</div>
          <div className="text-xs text-text-dim">Meta: {GOALS.run} km</div>
          <ProgressBar value={runKm} max={GOALS.run} color="#10b981" />
        </div>

        <div className="card">
          <div className="text-text-muted text-xs mb-1">🏋️ Academia</div>
          <div className="text-2xl font-black text-text">{gymCount}</div>
          <div className="text-xs text-text-dim">Meta: {GOALS.gym} treinos</div>
          <ProgressBar value={gymCount} max={GOALS.gym} color="#a855f7" />
        </div>

        <div className="card">
          <div className="text-text-muted text-xs mb-1">Melhor Pace</div>
          <div className="text-xs font-bold text-info mt-1">
            🚴 {bestBikePace ? formatPace(bestBikePace) : '—'}
          </div>
          <div className="text-xs font-bold text-success mt-1">
            🏃 {bestRunPace ? formatPace(bestRunPace) : '—'}
          </div>
        </div>
      </div>

      {/* Workouts list */}
      {workouts.length === 0 ? (
        <div className="card text-center py-12 text-text-muted">
          <Bike className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Nenhum treino registrado em {MONTHS[selectedMonth - 1]}</p>
          <p className="text-sm mt-1">Clique em "+ Novo Treino" para registrar!</p>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-bold text-text mb-4">Treinos de {MONTHS[selectedMonth - 1]}</h2>
          <div className="space-y-3">
            {workouts.map((w) => {
              const cfg = SPORT_CONFIG[w.type]
              return (
                <div
                  key={w.id}
                  className="flex items-center gap-4 py-3 border-b border-border/40 last:border-0"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 text-lg"
                    style={{ backgroundColor: `${cfg.color}20` }}
                  >
                    {cfg.emoji}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-text text-sm">{w.type}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        w.intensity === 'Leve'
                          ? 'bg-success/15 text-success'
                          : w.intensity === 'Moderada'
                          ? 'bg-accent/15 text-accent'
                          : 'bg-danger/15 text-danger'
                      }`}>{w.intensity}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {formatDate(w.date)}
                      {w.objective && <span className="ml-2 italic">· {w.objective}</span>}
                    </div>
                  </div>

                  <div className="flex gap-4 text-center shrink-0">
                    {w.type !== 'Academia' && (
                      <div>
                        <div className="text-sm font-bold text-text">{w.distanceKm} km</div>
                        <div className="text-xs text-text-dim">distância</div>
                      </div>
                    )}
                    <div>
                      <div className="text-sm font-bold text-text">{w.durationMin} min</div>
                      <div className="text-xs text-text-dim">tempo</div>
                    </div>
                    {w.type !== 'Academia' && (
                      <div>
                        <div className="text-sm font-bold text-info">{formatPace(w.paceMinPerKm)}</div>
                        <div className="text-xs text-text-dim">pace</div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setDeleteId(w.id)}
                    className="p-1.5 rounded hover:bg-danger/20 text-text-muted hover:text-danger transition-colors shrink-0"
                    title="Excluir treino"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* New Workout modal */}
      {showForm && (
        <Modal title="Novo Treino" onClose={() => setShowForm(false)} size="lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Mês de referência</label>
                <select
                  className="input"
                  value={formMonth}
                  onChange={(e) => setFormMonth(Number(e.target.value))}
                >
                  {MONTHS.map((m, i) => (
                    <option key={i} value={i + 1}>{m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sport type — 3 buttons */}
            <div>
              <label className="label">Tipo</label>
              <div className="grid grid-cols-3 gap-3">
                {(Object.entries(SPORT_CONFIG) as [SportType, typeof SPORT_CONFIG[SportType]][]).map(([t, cfg]) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setType(t); setDistanceStr('') }}
                    className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border transition-all font-medium text-sm ${
                      type === t ? 'border-opacity-80' : 'border-border text-text-muted'
                    }`}
                    style={type === t ? { borderColor: cfg.color, backgroundColor: `${cfg.color}20`, color: cfg.color } : {}}
                  >
                    <span className="text-base">{cfg.emoji}</span>
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Distance — hidden for Academia */}
              {!isGym && (
                <div>
                  <label className="label">Distância (km)</label>
                  <input
                    type="number"
                    className="input"
                    placeholder="Ex: 10.5"
                    value={distanceStr}
                    onChange={(e) => setDistanceStr(e.target.value)}
                    min="0.1"
                    step="0.1"
                  />
                </div>
              )}
              <div className={isGym ? 'col-span-2' : ''}>
                <label className="label">Tempo (minutos)</label>
                <input
                  type="number"
                  className="input"
                  placeholder="Ex: 45"
                  value={durationStr}
                  onChange={(e) => setDurationStr(e.target.value)}
                  min="1"
                />
              </div>
            </div>

            {/* Pace preview — only for Corrida/Bicicleta */}
            {!isGym && distanceStr && durationStr && parseFloat(distanceStr) > 0 && parseInt(durationStr) > 0 && (
              <div className="bg-info/10 border border-info/30 rounded-lg px-4 py-2 flex justify-between text-sm">
                <span className="text-text-muted">Pace calculado:</span>
                <span className="font-bold text-info">
                  {formatPace(parseInt(durationStr) / parseFloat(distanceStr))}
                </span>
              </div>
            )}

            <div>
              <label className="label">Intensidade</label>
              <div className="grid grid-cols-3 gap-2">
                {(['Leve', 'Moderada', 'Intensa'] as SportIntensity[]).map((i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIntensity(i)}
                    className={`py-2 rounded-lg border transition-all text-sm font-medium ${
                      intensity === i
                        ? i === 'Leve'
                          ? 'border-success bg-success/15 text-success'
                          : i === 'Moderada'
                          ? 'border-accent bg-accent/15 text-accent'
                          : 'border-danger bg-danger/15 text-danger'
                        : 'border-border text-text-muted'
                    }`}
                  >
                    {i}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="label">Objetivo (opcional)</label>
              <input
                className="input"
                placeholder={isGym ? 'Ex: Peito e tríceps, Legs day...' : 'Ex: Treino de recuperação, Fartlek, Longão...'}
                value={objective}
                onChange={(e) => setObjective(e.target.value)}
                maxLength={100}
              />
            </div>

            {formError && <p className="text-danger text-sm">{formError}</p>}

            <div className="flex gap-3 pt-2">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                Salvar Treino
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete confirmation */}
      {deleteId && workoutToDelete && (
        <Modal title="Excluir Treino" onClose={() => setDeleteId(null)} size="sm">
          <p className="text-text-muted mb-2">Tem certeza que deseja excluir este treino?</p>
          <p className="font-bold text-text mb-1">
            {SPORT_CONFIG[workoutToDelete.type].emoji} {workoutToDelete.type}
          </p>
          <p className="text-text-muted text-sm mb-5">
            {formatDate(workoutToDelete.date)} · {workoutToDelete.durationMin} min
            {workoutToDelete.type !== 'Academia' && ` · ${workoutToDelete.distanceKm} km`}
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleteId(null)}>Cancelar</button>
            <button className="btn-danger flex-1" onClick={confirmDelete}>Excluir</button>
          </div>
        </Modal>
      )}
    </div>
  )
}
