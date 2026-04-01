import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { Menu, Zap } from 'lucide-react'
import { SidebarContent } from './Sidebar'
import { ToastContainer } from '../shared/Toast'
import { LevelUpBanner } from '../shared/LevelUpBanner'

export function AppShell() {
  const [mobileOpen, setMobileOpen] = useState(false)

  const close = () => setMobileOpen(false)

  return (
    <div className="flex min-h-screen bg-bg">

      {/* ── DESKTOP sidebar ── visible only on md+, position sticky */}
      <aside
        style={{ display: 'none' }}
        className="md-sidebar w-60 shrink-0 bg-surface border-r border-border flex flex-col h-screen sticky top-0"
      >
        <SidebarContent onClose={() => {}} />
      </aside>

      {/* ── MOBILE drawer ── only mounted in DOM when open */}
      {mobileOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 z-40"
            onClick={close}
            aria-hidden="true"
          />
          {/* Drawer panel */}
          <aside className="fixed left-0 top-0 z-50 h-full w-72 flex flex-col bg-surface border-r border-border shadow-2xl">
            <SidebarContent onClose={close} />
          </aside>
        </>
      )}

      {/* ── Content column ── */}
      <div className="flex-1 flex flex-col min-h-screen min-w-0">

        {/* Mobile top bar with hamburger — hidden on desktop */}
        <header className="mobile-header flex items-center gap-3 px-4 py-3 bg-surface border-b border-border sticky top-0 z-30 shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-text-muted hover:text-text hover:bg-card transition-colors"
            aria-label="Abrir menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-accent" />
            <span className="text-lg font-black text-text">GameDay</span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      <ToastContainer />
      <LevelUpBanner />
    </div>
  )
}
