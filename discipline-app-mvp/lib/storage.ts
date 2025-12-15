/**
 * Local storage utilities for persisting user data
 * Future: Replace with TanStack Query fetching from IOTA explorer
 */

export interface UserStats {
  freeSessionsLeft: number
  streakCount: number
  disciplineScore: number
  totalCompleted: number
  lastActiveDate: string
}

export interface TaskRecord {
  id: string
  name: string
  category: string
  duration: number
  mode: "free" | "stake"
  stakeAmount?: number
  charityAddress?: string
  startTime: number
  endTime?: number
  completed: boolean
  proofSubmitted: boolean

  txHash?: string
  proofHash?: string
  objectId?: string
}

export interface WalletData {
  address: string
  lastConnected: number
}

const STORAGE_KEYS = {
  USER_STATS: "studystake_user_stats",
  TASK_HISTORY: "studystake_task_history",
  WALLET_DATA: "studystake_wallet_data",
  ACTIVE_TASK: "studystake_active_task",
}

// User Stats
export const getUserStats = (): UserStats => {
  if (typeof window === "undefined") return getDefaultStats()

  const stored = localStorage.getItem(STORAGE_KEYS.USER_STATS)
  if (!stored) return getDefaultStats()

  try {
    return JSON.parse(stored)
  } catch {
    return getDefaultStats()
  }
}

export const saveUserStats = (stats: UserStats) => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.USER_STATS, JSON.stringify(stats))
}

export const getDefaultStats = (): UserStats => ({
  freeSessionsLeft: 3,
  streakCount: 0,
  disciplineScore: 0,
  totalCompleted: 0,
  lastActiveDate: new Date().toISOString(),
})

// Task History
export const getTaskHistory = (): TaskRecord[] => {
  if (typeof window === "undefined") return []

  const stored = localStorage.getItem(STORAGE_KEYS.TASK_HISTORY)
  if (!stored) return []

  try {
    return JSON.parse(stored)
  } catch {
    return []
  }
}

export const saveTaskHistory = (history: TaskRecord[]) => {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEYS.TASK_HISTORY, JSON.stringify(history))
}

export const addTaskToHistory = (task: TaskRecord) => {
  const history = getTaskHistory()
  history.unshift(task) // Add to beginning
  // Keep last 100 tasks
  if (history.length > 100) {
    history.splice(100)
  }
  saveTaskHistory(history)
}

// Active Task
export const getActiveTask = (): TaskRecord | null => {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_TASK)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export const saveActiveTask = (task: TaskRecord | null) => {
  if (typeof window === "undefined") return

  if (task === null) {
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_TASK)
  } else {
    localStorage.setItem(STORAGE_KEYS.ACTIVE_TASK, JSON.stringify(task))
  }
}

// Wallet Data
export const getWalletData = (): WalletData | null => {
  if (typeof window === "undefined") return null

  const stored = localStorage.getItem(STORAGE_KEYS.WALLET_DATA)
  if (!stored) return null

  try {
    return JSON.parse(stored)
  } catch {
    return null
  }
}

export const saveWalletData = (data: WalletData | null) => {
  if (typeof window === "undefined") return

  if (data === null) {
    localStorage.removeItem(STORAGE_KEYS.WALLET_DATA)
  } else {
    localStorage.setItem(STORAGE_KEYS.WALLET_DATA, JSON.stringify(data))
  }
}

// Update streak and discipline score
export const updateStatsOnTaskComplete = (stakeAmount?: number) => {
  const stats = getUserStats()
  const today = new Date().toDateString()
  const lastActive = new Date(stats.lastActiveDate).toDateString()

  // Update streak
  if (today === lastActive) {
    // Same day, no streak change
  } else {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    if (yesterday.toDateString() === lastActive) {
      // Consecutive day
      stats.streakCount += 1
    } else {
      // Streak broken
      stats.streakCount = 1
    }
  }

  // Update discipline score
  const basePoints = 10
  const stakeBonus = stakeAmount ? Math.floor(stakeAmount * 2) : 0
  stats.disciplineScore += basePoints + stakeBonus

  stats.totalCompleted += 1
  stats.lastActiveDate = new Date().toISOString()

  saveUserStats(stats)
}

// Reset free sessions daily
export const checkAndResetFreeSessions = () => {
  const stats = getUserStats()
  const today = new Date().toDateString()
  const lastActive = new Date(stats.lastActiveDate).toDateString()

  if (today !== lastActive) {
    stats.freeSessionsLeft = 3
    stats.lastActiveDate = new Date().toISOString()
    saveUserStats(stats)
  }
}
