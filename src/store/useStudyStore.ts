import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { StudySession } from '../types'
import { calcStudyXp } from '../lib/xp'
import { useAppStore } from './useAppStore'

interface StudyState {
  sessions: StudySession[]
  addSession: (
    playerId: string,
    data: Omit<StudySession, 'id' | 'playerId' | 'questionsWrong' | 'xpEarned' | 'createdAt'>
  ) => void
  deleteSession: (id: string) => void
  getPlayerSessions: (playerId: string) => StudySession[]
}

export const useStudyStore = create<StudyState>()(
  persist(
    (set, get) => ({
      sessions: [],

      addSession: (playerId, data) => {
        const xpEarned = calcStudyXp(data.hours, data.questionsTotal, data.questionsCorrect)
        const session: StudySession = {
          id: uuid(),
          playerId,
          questionsWrong: data.questionsTotal - data.questionsCorrect,
          xpEarned,
          createdAt: new Date().toISOString(),
          ...data,
        }
        set((s) => ({ sessions: [...s.sessions, session] }))
        useAppStore
          .getState()
          .awardXp(
            playerId,
            xpEarned,
            'study_hours',
            `Estudo: ${data.subject} (${data.hours}h)`
          )
      },

      deleteSession: (id) =>
        set((s) => ({ sessions: s.sessions.filter((s) => s.id !== id) })),

      getPlayerSessions: (playerId) =>
        get()
          .sessions.filter((s) => s.playerId === playerId)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    }),
    { name: 'gameday:study' }
  )
)
