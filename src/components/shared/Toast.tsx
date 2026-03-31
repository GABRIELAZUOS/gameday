import { useEffect, useState } from 'react'
import { Zap, TrendingDown } from 'lucide-react'
import type { ToastItem } from '../../types'
import { useAppStore } from '../../store/useAppStore'

function ToastNotification({ toast }: { toast: ToastItem }) {
  const dismissToast = useAppStore((s) => s.dismissToast)
  const [visible, setVisible] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false)
      setTimeout(() => dismissToast(toast.id), 300)
    }, 3000)
    return () => clearTimeout(timer)
  }, [toast.id, dismissToast])

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border transition-all duration-300
        ${visible ? 'animate-toast-in opacity-100' : 'animate-toast-out opacity-0'}
        ${toast.isPositive
          ? 'bg-accent/10 border-accent/30 text-accent'
          : 'bg-danger/10 border-danger/30 text-danger'
        }`}
    >
      {toast.isPositive ? (
        <Zap className="w-4 h-4 shrink-0" />
      ) : (
        <TrendingDown className="w-4 h-4 shrink-0" />
      )}
      <div>
        <div className="font-bold text-sm">
          {toast.isPositive ? '+' : ''}{toast.amount} XP
        </div>
        <div className="text-xs opacity-80">{toast.description}</div>
      </div>
    </div>
  )
}

export function ToastContainer() {
  const toastQueue = useAppStore((s) => s.toastQueue)

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 items-end pointer-events-none">
      {toastQueue.slice(-5).map((toast) => (
        <ToastNotification key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
