import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { BottomNav } from './BottomNav'
import { ToastContainer } from '../shared/Toast'
import { LevelUpBanner } from '../shared/LevelUpBanner'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-screen pb-16 md:pb-0">
        <Outlet />
      </main>
      <BottomNav />
      <ToastContainer />
      <LevelUpBanner />
    </div>
  )
}
