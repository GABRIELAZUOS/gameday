import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'

export type SportType = 'Bicicleta' | 'Corrida' | 'Academia'
export type SportIntensity = 'Leve' | 'Moderada' | 'Intensa'

export interface Workout {
  id: string
  playerId: string
  date: string        // YYYY-MM-DD
  month: number       // 1-12
  year: number
  type: SportType
  distanceKm: number
  durationMin: number
  intensity: SportIntensity
  objective: string
  paceMinPerKm: number  // calculated: durationMin / distanceKm
  createdAt: string
}

function calcPace(durationMin: number, distanceKm: number): number {
  if (distanceKm <= 0) return 0
  return durationMin / distanceKm
}

interface SportsState {
  workouts: Workout[]
  addWorkout: (
    playerId: string,
    data: Omit<Workout, 'id' | 'playerId' | 'paceMinPerKm' | 'createdAt'>
  ) => void
  deleteWorkout: (id: string) => void
  getPlayerWorkouts: (playerId: string, month: number, year: number) => Workout[]
}

export const useSportsStore = create<SportsState>()(
  persist(
    (set, get) => ({
      workouts: [],

      addWorkout: (playerId, data) => {
        const workout: Workout = {
          id: uuid(),
          playerId,
          paceMinPerKm: calcPace(data.durationMin, data.distanceKm),
          createdAt: new Date().toISOString(),
          ...data,
        }
        set((s) => ({ workouts: [...s.workouts, workout] }))
      },

      deleteWorkout: (id) =>
        set((s) => ({ workouts: s.workouts.filter((w) => w.id !== id) })),

      getPlayerWorkouts: (playerId, month, year) =>
        get()
          .workouts.filter(
            (w) => w.playerId === playerId && w.month === month && w.year === year
          )
          .sort((a, b) => b.date.localeCompare(a.date)),
    }),
    { name: 'gameday:sports' }
  )
)
