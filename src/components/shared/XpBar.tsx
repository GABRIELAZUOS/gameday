import { getXpProgress, getLevelTitle, getLevelColor } from '../../lib/xp'

interface XpBarProps {
  xp: number
  showDetails?: boolean
  compact?: boolean
}

export function XpBar({ xp, showDetails = true, compact = false }: XpBarProps) {
  const { level, current, required, percentage } = getXpProgress(xp)
  const color = getLevelColor(level)
  const title = getLevelTitle(level)

  if (compact) {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span
          className="text-xs font-bold px-1.5 py-0.5 rounded shrink-0"
          style={{ color, backgroundColor: `${color}22` }}
        >
          Nv.{level}
        </span>
        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{ width: `${percentage}%`, backgroundColor: color }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <span
            className="text-sm font-bold px-2 py-0.5 rounded-lg"
            style={{ color, backgroundColor: `${color}22`, border: `1px solid ${color}44` }}
          >
            Nível {level}
          </span>
          <span className="text-xs text-text-muted">{title}</span>
        </div>
        {showDetails && (
          <span className="text-xs text-text-muted">
            {level < 50 ? `${current.toLocaleString()} / ${required.toLocaleString()} XP` : 'MAX'}
          </span>
        )}
      </div>
      <div className="h-3 bg-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700 relative"
          style={{ width: `${percentage}%`, backgroundColor: color }}
        >
          {percentage > 10 && (
            <div className="absolute inset-0 bg-white/10 rounded-full" />
          )}
        </div>
      </div>
      {showDetails && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-text-dim">XP Total: {xp.toLocaleString()}</span>
          <span className="text-xs text-text-dim">{percentage}%</span>
        </div>
      )}
    </div>
  )
}
