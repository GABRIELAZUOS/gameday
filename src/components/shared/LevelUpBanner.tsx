import { useAppStore } from '../../store/useAppStore'
import { getLevelTitle, getLevelColor } from '../../lib/xp'
import { Trophy, X } from 'lucide-react'

export function LevelUpBanner() {
  const levelUpPlayerId = useAppStore((s) => s.levelUpPlayerId)
  const players = useAppStore((s) => s.players)
  const dismissLevelUp = useAppStore((s) => s.dismissLevelUp)

  if (!levelUpPlayerId) return null

  const player = players.find((p) => p.id === levelUpPlayerId)
  if (!player) return null

  const color = getLevelColor(player.level)
  const title = getLevelTitle(player.level)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
      <div
        className="relative bg-surface border-2 rounded-2xl p-10 text-center max-w-sm w-full mx-4 animate-level-up shadow-2xl"
        style={{ borderColor: color, boxShadow: `0 0 40px ${color}66` }}
      >
        <button
          onClick={dismissLevelUp}
          className="absolute top-3 right-3 text-text-muted hover:text-text"
        >
          <X className="w-5 h-5" />
        </button>
        <Trophy className="w-16 h-16 mx-auto mb-4 animate-float" style={{ color }} />
        <div className="text-text-muted text-sm uppercase tracking-widest mb-1">Subiu de Nível!</div>
        <div className="text-5xl font-black mb-2" style={{ color }}>
          Nível {player.level}
        </div>
        <div
          className="text-lg font-semibold px-4 py-1.5 rounded-full inline-block mb-4"
          style={{ color, backgroundColor: `${color}22` }}
        >
          {title}
        </div>
        <div className="text-text-muted text-sm">
          Parabéns, <span className="text-text font-bold">{player.nickname}</span>!
        </div>
        <button
          onClick={dismissLevelUp}
          className="mt-6 btn-primary w-full"
          style={{ backgroundColor: color }}
        >
          Continuar!
        </button>
      </div>
    </div>
  )
}
