import { Outlet } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '../shared/Toast'
import { LevelUpBanner } from '../shared/LevelUpBanner'

export function AppShell() {
  return (
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="flex-1 overflow-y-auto min-h-screen">
        <Outlet />
      </main>
      <ToastContainer />
      <LevelUpBanner />
    </div>
  )
}
