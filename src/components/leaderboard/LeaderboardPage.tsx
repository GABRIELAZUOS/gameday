import { Trophy, Crown, Medal } from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'
import { Avatar } from '../shared/Avatar'
import { getLevelTitle, getLevelColor } from '../../lib/xp'

export function LeaderboardPage() {
  const players = useAppStore((s) => s.players)
  const sorted = [...players].sort((a, b) => b.xp - a.xp)

  // Podium visual order: 2nd | 1st | 3rd
  // Each slot explicitly carries its player and its display config
  type PodiumSlot = {
    player: typeof sorted[0]
    rank: number
    height: string
    color: string
    label: string
    icon: typeof Crown
    isCenter: boolean
  }

  const podiumSlots: PodiumSlot[] = []
  if (sorted.length >= 1) {
    const slots: PodiumSlot[] = []
    if (sorted[0]) slots.push({ player: sorted[0], rank: 1, height: 'h-28', color: '#f59e0b', label: '1°', icon: Crown, isCenter: true })
    if (sorted[1]) slots.push({ player: sorted[1], rank: 2, height: 'h-20', color: '#94a3b8', label: '2°', icon: Medal, isCenter: false })
    if (sorted[2]) slots.push({ player: sorted[2], rank: 3, height: 'h-16', color: '#cd7f32', label: '3°', icon: Medal, isCenter: false })

    // Reorder visually: [2nd, 1st, 3rd]
    if (slots.length === 1) podiumSlots.push(slots[0])
    else if (slots.length === 2) podiumSlots.push(slots[1], slots[0])
    else podiumSlots.push(slots[1], slots[0], slots[2])
  }

  return (
    <div className="module-page">
      <h1 className="page-title flex items-center gap-3">
        <Trophy className="w-7 h-7 text-accent" />
        Ranking de Jogadores
      </h1>

      {players.length === 0 ? (
        <div className="card text-center py-12 text-text-muted">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Nenhum jogador cadastrado ainda.</p>
        </div>
      ) : (
        <>
          {/* Podium */}
          {sorted.length >= 1 && (
            <div className="card mb-6">
              <div className="flex items-end justify-center gap-4 pb-4">
                {podiumSlots.map((slot) => {
                  const Icon = slot.icon
                  const levelColor = getLevelColor(slot.player.level)
                  return (
                    <div key={slot.player.id} className="flex flex-col items-center gap-2">
                      <div className="relative">
                        <Icon className="w-6 h-6 absolute -top-3 left-1/2 -translate-x-1/2" style={{ color: slot.color }} />
                        <Avatar
                          photoUrl={slot.player.photoUrl}
                          nickname={slot.player.nickname}
                          size={slot.isCenter ? 'lg' : 'md'}
                        />
                      </div>
                      <div className="text-center">
                        <div className="font-bold text-text text-sm">{slot.player.nickname}</div>
                        <div className="text-xs font-bold" style={{ color: levelColor }}>
                          {slot.player.xp.toLocaleString()} XP
                        </div>
                      </div>
                      <div
                        className={`${slot.height} w-20 rounded-t-lg flex items-end justify-center pb-2 font-black text-white text-lg`}
                        style={{ backgroundColor: `${slot.color}33`, border: `1px solid ${slot.color}55` }}
                      >
                        {slot.label}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Full ranking */}
          <div className="card">
            <h2 className="font-bold text-text mb-4">Classificação Geral</h2>
            <div className="space-y-3">
              {sorted.map((player, idx) => {
                const rank = idx + 1
                const color = getLevelColor(player.level)
                const maxXp = sorted[0]?.xp || 1
                return (
                  <div
                    key={player.id}
                    className="flex items-center gap-4 py-2 border-b border-border/40 last:border-0"
                  >
                    <div className="w-8 text-center shrink-0">
                      {rank === 1 ? (
                        <Crown className="w-5 h-5 text-accent mx-auto" />
                      ) : rank === 2 ? (
                        <Medal className="w-5 h-5 mx-auto" style={{ color: '#94a3b8' }} />
                      ) : rank === 3 ? (
                        <Medal className="w-5 h-5 mx-auto" style={{ color: '#cd7f32' }} />
                      ) : (
                        <span className="text-text-muted text-sm font-bold">{rank}°</span>
                      )}
                    </div>
                    <Avatar photoUrl={player.photoUrl} nickname={player.nickname} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-text text-sm truncate">{player.nickname}</span>
                        <span
                          className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
                          style={{ color, backgroundColor: `${color}22` }}
                        >
                          Nv.{player.level}
                        </span>
                        <span className="text-xs text-text-dim shrink-0">{getLevelTitle(player.level)}</span>
                      </div>
                      <div className="h-1.5 bg-border rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{ width: `${(player.xp / maxXp) * 100}%`, backgroundColor: color }}
                        />
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="font-black text-sm" style={{ color }}>
                        {player.xp.toLocaleString()} XP
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
