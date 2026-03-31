import { useState } from 'react'
import { Plus, Trash2, Edit2, Zap, Lock, Eye, EyeOff } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { useHabitsStore } from '../../store/useHabitsStore'
import { Avatar } from '../shared/Avatar'
import { XpBar } from '../shared/XpBar'
import { Modal } from '../shared/Modal'
import { PlayerForm } from './PlayerForm'
import { checkPassword } from '../../lib/hash'
import type { Player } from '../../types'

export function PlayerSelect() {
  const players = useAppStore((s) => s.players)
  const addPlayer = useAppStore((s) => s.addPlayer)
  const updatePlayer = useAppStore((s) => s.updatePlayer)
  const deletePlayer = useAppStore((s) => s.deletePlayer)
  const setActivePlayer = useAppStore((s) => s.setActivePlayer)
  const initHabits = useHabitsStore((s) => s.initHabitsForPlayer)

  const [showCreate, setShowCreate] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)

  // Password unlock flow
  const [lockPlayer, setLockPlayer] = useState<Player | null>(null)
  const [pwInput, setPwInput] = useState('')
  const [pwError, setPwError] = useState('')
  const [showPw, setShowPw] = useState(false)

  function handleCreate(data: { nickname: string; realName: string; photoUrl: string | null; passwordHash?: string }) {
    const player = addPlayer(data)
    initHabits(player.id)
    setShowCreate(false)
  }

  function handleSelect(player: Player) {
    if (player.passwordHash) {
      // Has password — show unlock modal
      setLockPlayer(player)
      setPwInput('')
      setPwError('')
      setShowPw(false)
    } else {
      initHabits(player.id)
      setActivePlayer(player.id)
    }
  }

  function handleUnlock() {
    if (!lockPlayer) return
    if (checkPassword(pwInput, lockPlayer.passwordHash!)) {
      initHabits(lockPlayer.id)
      setActivePlayer(lockPlayer.id)
      setLockPlayer(null)
    } else {
      setPwError('Senha incorreta. Tente novamente.')
    }
  }

  const editPlayer = players.find((p) => p.id === editId)

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center p-6">
      {/* Header */}
      <div className="mb-10 text-center">
        <div className="flex items-center justify-center gap-3 mb-3">
          <Zap className="w-10 h-10 text-accent" />
          <h1 className="text-5xl font-black text-text">GameDay</h1>
        </div>
        <p className="text-text-muted text-lg">Sistema de Gamificação de Hábitos</p>
      </div>

      {/* Players grid */}
      <div className="w-full max-w-4xl">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {players.map((player) => (
            <div
              key={player.id}
              className="card cursor-pointer hover:border-primary/50 transition-all group relative"
              onClick={() => handleSelect(player)}
            >
              {/* Action buttons */}
              <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditId(player.id) }}
                  className="p-1.5 rounded-lg bg-surface hover:bg-primary/20 text-text-muted hover:text-primary transition-colors"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); setDeleteId(player.id) }}
                  className="p-1.5 rounded-lg bg-surface hover:bg-danger/20 text-text-muted hover:text-danger transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex flex-col items-center text-center gap-3">
                <div className="relative">
                  <Avatar photoUrl={player.photoUrl} nickname={player.nickname} size="lg" />
                  {player.passwordHash && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                      <Lock className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="font-bold text-text text-lg">{player.nickname}</div>
                  {player.realName && (
                    <div className="text-text-muted text-sm">{player.realName}</div>
                  )}
                </div>
                <div className="w-full">
                  <XpBar xp={player.xp} showDetails compact={false} />
                </div>
                <div className="text-xs text-text-dim">
                  Desde {new Date(player.createdAt).toLocaleDateString('pt-BR')}
                </div>
              </div>
            </div>
          ))}

          {/* Add player card */}
          <button
            onClick={() => setShowCreate(true)}
            className="card flex flex-col items-center justify-center gap-3 min-h-[200px] border-dashed hover:border-primary/50 hover:bg-primary/5 transition-all text-text-muted hover:text-primary"
          >
            <Plus className="w-10 h-10" />
            <span className="font-medium">Novo Jogador</span>
          </button>
        </div>

        {players.length === 0 && (
          <p className="text-center text-text-muted text-sm">
            Nenhum jogador ainda. Crie o primeiro acima!
          </p>
        )}
      </div>

      {/* Create modal */}
      {showCreate && (
        <Modal title="Criar Jogador" onClose={() => setShowCreate(false)}>
          <PlayerForm
            onSave={handleCreate}
            onCancel={() => setShowCreate(false)}
          />
        </Modal>
      )}

      {/* Edit modal */}
      {editId && editPlayer && (
        <Modal title="Editar Jogador" onClose={() => setEditId(null)}>
          <PlayerForm
            initial={editPlayer}
            onSave={(data) => { updatePlayer(editId, data); setEditId(null) }}
            onCancel={() => setEditId(null)}
            submitLabel="Salvar"
          />
        </Modal>
      )}

      {/* Delete confirm */}
      {deleteId && (
        <Modal title="Excluir Jogador" onClose={() => setDeleteId(null)} size="sm">
          <p className="text-text-muted mb-5">
            Tem certeza? Todos os dados do jogador serão excluídos permanentemente.
          </p>
          <div className="flex gap-3">
            <button className="btn-secondary flex-1" onClick={() => setDeleteId(null)}>
              Cancelar
            </button>
            <button
              className="btn-danger flex-1"
              onClick={() => { deletePlayer(deleteId); setDeleteId(null) }}
            >
              Excluir
            </button>
          </div>
        </Modal>
      )}

      {/* Password unlock modal */}
      {lockPlayer && (
        <Modal title="Perfil Protegido" onClose={() => setLockPlayer(null)} size="sm">
          <div className="flex flex-col items-center gap-3 mb-5">
            <div className="relative">
              <Avatar photoUrl={lockPlayer.photoUrl} nickname={lockPlayer.nickname} size="lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                <Lock className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
            <div className="text-center">
              <div className="font-bold text-text">{lockPlayer.nickname}</div>
              <div className="text-text-muted text-sm">Digite a senha para acessar</div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="label">Senha</label>
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  className="input pr-9"
                  value={pwInput}
                  onChange={(e) => { setPwInput(e.target.value); setPwError('') }}
                  onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
                  placeholder="Digite a senha"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {pwError && <p className="text-danger text-sm">{pwError}</p>}
            <div className="flex gap-3">
              <button className="btn-secondary flex-1" onClick={() => setLockPlayer(null)}>
                Cancelar
              </button>
              <button className="btn-primary flex-1" onClick={handleUnlock}>
                Entrar
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
