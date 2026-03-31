import { useEffect, useRef } from 'react'
import { Play, Pause, RotateCcw, SkipForward, Settings } from 'lucide-react'
import { useState } from 'react'
import { useActivePlayer } from '../../store/useAppStore'
import { usePomodoroStore } from '../../store/usePomodoroStore'
import { todayKey } from '../../lib/dateUtils'
import { XP_REWARDS } from '../../constants/xp'

const PHASE_LABELS = {
  idle: 'Pronto para focar',
  work: 'Foco',
  shortBreak: 'Pausa Curta',
  longBreak: 'Pausa Longa',
}

const PHASE_COLORS = {
  idle: '#7c3aed',
  work: '#ef4444',
  shortBreak: '#10b981',
  longBreak: '#3b82f6',
}

export function PomodoroPage() {
  const player = useActivePlayer()
  const { timer, config, sessions, startTimer, pauseTimer, resetTimer, tick, skipPhase, completePhase, updateConfig } = usePomodoroStore()
  const [showSettings, setShowSettings] = useState(false)
  const [localConfig, setLocalConfig] = useState(config)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Timer tick
  useEffect(() => {
    if (timer.isRunning) {
      intervalRef.current = setInterval(() => {
        tick()
      }, 1000)
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [timer.isRunning, tick])

  // Auto complete phase when time runs out
  const prevSeconds = useRef(timer.secondsRemaining)
  useEffect(() => {
    if (timer.isRunning && timer.secondsRemaining === 0 && prevSeconds.current > 0 && player) {
      completePhase(player.id)
      // Play a simple beep using AudioContext
      try {
        const ctx = new AudioContext()
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.frequency.value = 880
        gain.gain.setValueAtTime(0.3, ctx.currentTime)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
        osc.start(ctx.currentTime)
        osc.stop(ctx.currentTime + 0.8)
      } catch {}
    }
    prevSeconds.current = timer.secondsRemaining
  }, [timer.secondsRemaining, timer.isRunning, player, completePhase])

  if (!player) return null

  const todaySessions = sessions.filter((s) => s.playerId === player.id && s.date === todayKey())
  const todayCycles = todaySessions.reduce((a, s) => a + s.completedCycles, 0)
  const todayXp = todaySessions.reduce((a, s) => a + s.xpEarned, 0)

  const mins = Math.floor(timer.secondsRemaining / 60).toString().padStart(2, '0')
  const secs = (timer.secondsRemaining % 60).toString().padStart(2, '0')
  const color = PHASE_COLORS[timer.phase]

  // Circle progress
  const totalSeconds = (() => {
    if (timer.phase === 'work') return config.workMinutes * 60
    if (timer.phase === 'shortBreak') return config.shortBreakMinutes * 60
    if (timer.phase === 'longBreak') return config.longBreakMinutes * 60
    return config.workMinutes * 60
  })()
  const radius = 90
  const circumference = 2 * Math.PI * radius
  const progress = totalSeconds > 0 ? 1 - timer.secondsRemaining / totalSeconds : 0
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="module-page flex flex-col items-center">
      <div className="flex items-center justify-between w-full mb-8">
        <h1 className="page-title mb-0">Foco (Pomodoro)</h1>
        <button
          onClick={() => setShowSettings((v) => !v)}
          className="btn-secondary flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          Configurar
        </button>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="card w-full mb-6 border-primary/30">
          <h2 className="font-bold text-text mb-4">Configurações do Timer</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Foco (min)', key: 'workMinutes' as const, min: 1, max: 90 },
              { label: 'Pausa curta (min)', key: 'shortBreakMinutes' as const, min: 1, max: 30 },
              { label: 'Pausa longa (min)', key: 'longBreakMinutes' as const, min: 1, max: 60 },
              { label: 'Ciclos p/ pausa longa', key: 'cyclesBeforeLongBreak' as const, min: 1, max: 8 },
            ].map(({ label, key, min, max }) => (
              <div key={key}>
                <label className="label">{label}</label>
                <input
                  type="number"
                  className="input"
                  value={localConfig[key]}
                  onChange={(e) => setLocalConfig((c) => ({ ...c, [key]: Number(e.target.value) }))}
                  min={min}
                  max={max}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button className="btn-secondary flex-1" onClick={() => setShowSettings(false)}>
              Cancelar
            </button>
            <button
              className="btn-primary flex-1"
              onClick={() => { updateConfig(localConfig); setShowSettings(false) }}
            >
              Salvar
            </button>
          </div>
        </div>
      )}

      {/* Timer circle */}
      <div className="flex flex-col items-center mb-8">
        <div className="relative" style={{ width: 220, height: 220 }}>
          <svg width="220" height="220" className="-rotate-90">
            <circle cx="110" cy="110" r={radius} fill="none" stroke="#2a2a4a" strokeWidth="12" />
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="none"
              stroke={color}
              strokeWidth="12"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 1s linear', filter: `drop-shadow(0 0 8px ${color}88)` }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="text-5xl font-black text-text tabular-nums">
              {mins}:{secs}
            </div>
            <div className="text-sm font-medium mt-1" style={{ color }}>
              {PHASE_LABELS[timer.phase]}
            </div>
            {timer.cycleCount > 0 && (
              <div className="text-xs text-text-dim mt-1">Ciclo #{timer.cycleCount}</div>
            )}
          </div>
        </div>

        {/* Phase indicators */}
        <div className="flex gap-2 mt-4">
          {Array.from({ length: config.cyclesBeforeLongBreak }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full transition-all"
              style={{
                backgroundColor: i < (timer.cycleCount % config.cyclesBeforeLongBreak) ? '#ef4444' : '#2a2a4a',
                boxShadow: i < (timer.cycleCount % config.cyclesBeforeLongBreak) ? '0 0 6px #ef4444' : 'none',
              }}
            />
          ))}
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-4 mb-8">
        <button
          onClick={resetTimer}
          className="w-12 h-12 rounded-full bg-surface border border-border hover:border-text-muted text-text-muted hover:text-text flex items-center justify-center transition-all"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={timer.isRunning ? pauseTimer : startTimer}
          className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold shadow-lg transition-all hover:scale-105"
          style={{ backgroundColor: color, boxShadow: `0 0 20px ${color}66` }}
        >
          {timer.isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
        </button>
        <button
          onClick={() => player && skipPhase(player.id)}
          className="w-12 h-12 rounded-full bg-surface border border-border hover:border-text-muted text-text-muted hover:text-text flex items-center justify-center transition-all"
        >
          <SkipForward className="w-5 h-5" />
        </button>
      </div>

      {/* Today's stats */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-sm">
        {[
          { label: 'Ciclos Hoje', value: todayCycles },
          { label: 'Tempo de Foco', value: `${(todayCycles * config.workMinutes)}min` },
          { label: 'XP Ganho', value: `+${todayXp}` },
        ].map(({ label, value }) => (
          <div key={label} className="card text-center">
            <div className="text-text-muted text-xs mb-1">{label}</div>
            <div className="font-black text-text">{value}</div>
          </div>
        ))}
      </div>

      {/* XP per cycle info */}
      <div className="mt-6 text-center text-xs text-text-dim">
        +{XP_REWARDS.POMODORO_CYCLE} XP por ciclo · +{XP_REWARDS.POMODORO_SET} XP a cada {config.cyclesBeforeLongBreak} ciclos
      </div>
    </div>
  )
}
