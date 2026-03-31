import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  DollarSign,
  Timer,
  Trophy,
  LogOut,
  Zap,
  Bike,
} from 'lucide-react'
import { useAppStore, useActivePlayer } from '../../store/useAppStore'
import { Avatar } from '../shared/Avatar'
import { XpBar } from '../shared/XpBar'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/habits', icon: CheckSquare, label: 'Hábitos' },
  { to: '/study', icon: BookOpen, label: 'Estudos' },
  { to: '/finance', icon: DollarSign, label: 'Finanças' },
  { to: '/pomodoro', icon: Timer, label: 'Foco' },
  { to: '/sports', icon: Bike, label: 'Esportes' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranking' },
]

export function Sidebar() {
  const player = useActivePlayer()
  const setActivePlayer = useAppStore((s) => s.setActivePlayer)

  return (
    <aside className="w-60 shrink-0 bg-surface border-r border-border hidden md:flex flex-col h-screen sticky top-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2">
          <Zap className="w-6 h-6 text-accent" />
          <span className="text-xl font-black text-text">GameDay</span>
        </div>
      </div>

      {/* Player mini-card */}
      {player && (
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3 mb-3">
            <Avatar photoUrl={player.photoUrl} nickname={player.nickname} size="sm" />
            <div className="min-w-0">
              <div className="font-semibold text-text text-sm truncate">{player.nickname}</div>
              {player.realName && (
                <div className="text-xs text-text-muted truncate">{player.realName}</div>
              )}
            </div>
          </div>
          <XpBar xp={player.xp} showDetails={false} compact />
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {nav.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 transition-all duration-150 text-sm font-medium
              ${isActive
                ? 'bg-primary/20 text-primary-light border border-primary/30'
                : 'text-text-muted hover:text-text hover:bg-card'
              }`
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-border">
        <button
          onClick={() => setActivePlayer(null)}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg w-full text-sm font-medium text-text-muted hover:text-danger hover:bg-danger/10 transition-all"
        >
          <LogOut className="w-4 h-4" />
          Trocar Jogador
        </button>
      </div>
    </aside>
  )
}
