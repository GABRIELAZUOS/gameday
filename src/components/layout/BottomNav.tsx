import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  CheckSquare,
  BookOpen,
  DollarSign,
  Timer,
  Trophy,
  Bike,
  LogOut,
} from 'lucide-react'
import { useAppStore } from '../../store/useAppStore'

const nav = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Início' },
  { to: '/habits', icon: CheckSquare, label: 'Hábitos' },
  { to: '/study', icon: BookOpen, label: 'Estudos' },
  { to: '/finance', icon: DollarSign, label: 'Finanças' },
  { to: '/pomodoro', icon: Timer, label: 'Foco' },
  { to: '/sports', icon: Bike, label: 'Esportes' },
  { to: '/leaderboard', icon: Trophy, label: 'Ranking' },
]

export function BottomNav() {
  const setActivePlayer = useAppStore((s) => s.setActivePlayer)

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface border-t border-border flex md:hidden"
         style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
      {nav.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex-1 flex flex-col items-center justify-center py-2 gap-0.5 transition-colors min-w-0 ${
              isActive ? 'text-primary-light' : 'text-text-muted'
            }`
          }
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span className="text-[9px] font-medium leading-none truncate w-full text-center px-0.5">{label}</span>
        </NavLink>
      ))}
      <button
        onClick={() => setActivePlayer(null)}
        className="flex-1 flex flex-col items-center justify-center py-2 gap-0.5 text-text-muted hover:text-danger transition-colors min-w-0"
      >
        <LogOut className="w-5 h-5 shrink-0" />
        <span className="text-[9px] font-medium leading-none">Sair</span>
      </button>
    </nav>
  )
}
