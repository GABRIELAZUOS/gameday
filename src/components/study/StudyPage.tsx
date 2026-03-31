import { useState } from 'react'
import { Plus, Trash2, BookOpen, Clock, Target, TrendingUp } from 'lucide-react'
import { useActivePlayer } from '../../store/useAppStore'
import { useStudyStore } from '../../store/useStudyStore'
import { calcStudyXp } from '../../lib/xp'
import { todayKey, formatDate } from '../../lib/dateUtils'
import { Modal } from '../shared/Modal'

// Parse "HH:MM" or decimal string into total hours (decimal)
function parseHoursInput(raw: string): number | null {
  const trimmed = raw.trim()
  if (!trimmed) return null

  // HH:MM format
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':')
    if (parts.length !== 2) return null
    const h = parseInt(parts[0], 10)
    const m = parseInt(parts[1], 10)
    if (isNaN(h) || isNaN(m)) return null
    if (m < 0 || m > 59) return null
    const total = h * 60 + m
    if (total < 1 || total > 720) return null
    return total / 60
  }

  // Decimal format
  const num = parseFloat(trimmed)
  if (isNaN(num)) return null
  const totalMinutes = Math.round(num * 60)
  if (totalMinutes < 1 || totalMinutes > 720) return null
  return totalMinutes / 60
}

// Format decimal hours as "Xh Ym" for display
function formatHours(hours: number): string {
  const totalMinutes = Math.round(hours * 60)
  const h = Math.floor(totalMinutes / 60)
  const m = totalMinutes % 60
  if (h === 0) return `${m}min`
  if (m === 0) return `${h}h`
  return `${h}h ${m}min`
}

export function StudyPage() {
  const player = useActivePlayer()
  const getPlayerSessions = useStudyStore((s) => s.getPlayerSessions)
  const addSession = useStudyStore((s) => s.addSession)
  const deleteSession = useStudyStore((s) => s.deleteSession)

  const [date, setDate] = useState(todayKey())
  const [subject, setSubject] = useState('')
  const [hoursInput, setHoursInput] = useState('')
  const [total, setTotal] = useState('')
  const [correct, setCorrect] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  if (!player) return null

  const sessions = getPlayerSessions(player.id)

  const totalHours = sessions.reduce((a, s) => a + s.hours, 0)
  const totalXp = sessions.reduce((a, s) => a + s.xpEarned, 0)
  const totalCorrect = sessions.reduce((a, s) => a + s.questionsCorrect, 0)
  const totalQuestions = sessions.reduce((a, s) => a + s.questionsTotal, 0)
  const accuracy = totalQuestions > 0 ? ((totalCorrect / totalQuestions) * 100).toFixed(1) : '—'

  const parsedHours = parseHoursInput(hoursInput)
  const totalNum = parseInt(total) || 0
  const correctNum = parseInt(correct) || 0
  const preview = parsedHours !== null ? calcStudyXp(parsedHours, totalNum, correctNum) : 0

  const sessionToDelete = sessions.find((s) => s.id === deleteId)

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!subject.trim()) return setError('Informe o assunto')

    const hours = parseHoursInput(hoursInput)
    if (hours === null) return setError('Duração inválida. Use HH:MM (ex: 1:30) ou decimal (ex: 1.5). Mínimo 1 min, máximo 12h.')
    if (correctNum > totalNum) return setError('Corretas não podem ser mais que o total')
    setError('')

    addSession(player!.id, {
      date,
      subject: subject.trim(),
      hours,
      questionsTotal: totalNum,
      questionsCorrect: correctNum,
    })
    setSubject('')
    setHoursInput('')
    setTotal('')
    setCorrect('')
    setDate(todayKey())
    setShowForm(false)
  }

  function confirmDelete() {
    if (deleteId) deleteSession(deleteId)
    setDeleteId(null)
  }

  return (
    <div className="module-page">
      <div className="flex items-center justify-between mb-6">
        <h1 className="page-title mb-0">Estudos</h1>
        <button onClick={() => setShowForm((v) => !v)} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Registrar Sessão
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total de Horas', value: formatHours(totalHours), icon: Clock, color: '#3b82f6' },
          { label: 'Sessões', value: sessions.length, icon: BookOpen, color: '#a855f7' },
          { label: 'Taxa de Acerto', value: accuracy + (accuracy !== '—' ? '%' : ''), icon: Target, color: '#10b981' },
          { label: 'XP de Estudos', value: totalXp + ' XP', icon: TrendingUp, color: '#f59e0b' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card">
            <div className="flex items-center justify-between mb-1">
              <span className="text-text-muted text-xs">{label}</span>
              <Icon className="w-4 h-4" style={{ color }} />
            </div>
            <div className="text-xl font-black text-text">{value}</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="card mb-6 border-primary/30">
          <h2 className="font-bold text-text mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-primary-light" />
            Nova Sessão de Estudo
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Data</label>
                <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
              </div>
              <div>
                <label className="label">Duração (HH:MM ou decimal)</label>
                <input
                  className="input"
                  placeholder="Ex: 1:30 ou 1.5"
                  value={hoursInput}
                  onChange={(e) => setHoursInput(e.target.value)}
                />
                <p className="text-xs text-text-dim mt-1">Mín: 0:01 · Máx: 12:00</p>
              </div>
            </div>
            <div>
              <label className="label">Assunto</label>
              <input
                className="input"
                placeholder="Ex: Matemática — Cálculo Diferencial"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                maxLength={80}
              />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="label">Total de Questões</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={total}
                  onChange={(e) => setTotal(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="label">Corretas</label>
                <input
                  type="number"
                  className="input"
                  placeholder="0"
                  value={correct}
                  onChange={(e) => setCorrect(e.target.value)}
                  min="0"
                />
              </div>
              <div>
                <label className="label">Erradas</label>
                <input
                  type="number"
                  className="input"
                  value={totalNum > 0 ? Math.max(0, totalNum - correctNum) : ''}
                  readOnly
                  placeholder="—"
                />
              </div>
            </div>

            {/* XP preview */}
            {parsedHours !== null && (
              <div className="bg-accent/10 border border-accent/30 rounded-lg px-4 py-2 flex items-center justify-between">
                <span className="text-sm text-text-muted">XP que será ganho:</span>
                <span className="font-black text-accent">+{preview} XP</span>
              </div>
            )}

            {error && <p className="text-danger text-sm">{error}</p>}

            <div className="flex gap-3">
              <button type="button" className="btn-secondary flex-1" onClick={() => setShowForm(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn-primary flex-1">
                Registrar
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Sessions list */}
      {sessions.length === 0 ? (
        <div className="card text-center py-12 text-text-muted">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhuma sessão registrada ainda.</p>
          <p className="text-sm mt-1">Clique em "Registrar Sessão" para começar!</p>
        </div>
      ) : (
        <div className="card">
          <h2 className="font-bold text-text mb-4">Histórico de Sessões</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-text-muted text-left border-b border-border">
                  <th className="pb-2 font-medium">Data</th>
                  <th className="pb-2 font-medium">Assunto</th>
                  <th className="pb-2 font-medium text-center">Duração</th>
                  <th className="pb-2 font-medium text-center">Questões</th>
                  <th className="pb-2 font-medium text-center">Acerto</th>
                  <th className="pb-2 font-medium text-right">XP</th>
                  <th className="pb-2 w-8"></th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const acc = s.questionsTotal > 0
                    ? ((s.questionsCorrect / s.questionsTotal) * 100).toFixed(0)
                    : null
                  return (
                    <tr key={s.id} className="border-b border-border/40 last:border-0 hover:bg-surface/50">
                      <td className="py-2.5 text-text-muted">{formatDate(s.date)}</td>
                      <td className="py-2.5 text-text font-medium max-w-[180px] truncate">{s.subject}</td>
                      <td className="py-2.5 text-center text-info">{formatHours(s.hours)}</td>
                      <td className="py-2.5 text-center text-text-muted">
                        {s.questionsTotal > 0 ? `${s.questionsCorrect}/${s.questionsTotal}` : '—'}
                      </td>
                      <td className="py-2.5 text-center">
                        {acc ? (
                          <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                            Number(acc) >= 80 ? 'text-success bg-success/10' : 'text-danger bg-danger/10'
                          }`}>{acc}%</span>
                        ) : '—'}
                      </td>
                      <td className="py-2.5 text-right font-bold text-accent">+{s.xpEarned}</td>
                      <td className="py-2.5">
                        <button
                          onClick={() => setDeleteId(s.id)}
                          className="p-1 rounded hover:bg-danger/20 text-text-muted hover:text-danger transition-colors"
                          title="Excluir sessão"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {deleteId && sessionToDelete && (
        <Modal title="Excluir Sessão" onClose={() => setDeleteId(null)} size="sm">
          <p className="text-text-muted mb-2">Tem certeza que deseja excluir a sessão:</p>
          <p className="font-bold text-text mb-1">"{sessionToDelete.subject}"</p>
          <p className="text-text-muted text-sm mb-5">
            {formatDate(sessionToDelete.date)} · {formatHours(sessionToDelete.hours)} · +{sessionToDelete.xpEarned} XP
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleteId(null)}>
              Cancelar
            </button>
            <button className="btn-danger flex-1" onClick={confirmDelete}>
              Excluir
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
