"use client"

import { useEffect, useState, useCallback } from "react"

export interface TabVisibilityState {
  isVisible: boolean
  hiddenDuration: number // in seconds
  showWarning: boolean
}

interface UseTabVisibilityOptions {
  warningThreshold?: number // seconds before showing warning (default: 20)
  forfeitThreshold?: number // seconds before forfeiting stake (default: 30)
  onWarning?: () => void
  onForfeit?: () => void
}

export function useTabVisibility({
  warningThreshold = 20,
  forfeitThreshold = 30,
  onWarning,
  onForfeit,
}: UseTabVisibilityOptions = {}) {
  const [state, setState] = useState<TabVisibilityState>({
    isVisible: true,
    hiddenDuration: 0,
    showWarning: false,
  })
  
  const [hiddenStartTime, setHiddenStartTime] = useState<number | null>(null)
  const [warningShown, setWarningShown] = useState(false)
  const [forfeitTriggered, setForfeitTriggered] = useState(false)

  // Handle visibility change
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden) {
      // Tab became hidden
      setHiddenStartTime(Date.now())
      setWarningShown(false)
      setState(prev => ({ ...prev, isVisible: false }))
    } else {
      // Tab became visible
      setHiddenStartTime(null)
      setWarningShown(false)
      setState({
        isVisible: true,
        hiddenDuration: 0,
        showWarning: false,
      })
    }
  }, [])

  // Monitor hidden duration
  useEffect(() => {
    if (hiddenStartTime === null) return

    const interval = setInterval(() => {
      const duration = Math.floor((Date.now() - hiddenStartTime) / 1000)
      
      setState(prev => ({
        ...prev,
        hiddenDuration: duration,
        showWarning: duration >= warningThreshold,
      }))

      // Trigger warning
      if (duration >= warningThreshold && !warningShown) {
        setWarningShown(true)
        onWarning?.()
      }

      // Trigger forfeit
      if (duration >= forfeitThreshold && !forfeitTriggered) {
        setForfeitTriggered(true)
        onForfeit?.()
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [hiddenStartTime, warningThreshold, forfeitThreshold, warningShown, forfeitTriggered, onWarning, onForfeit])

  // Set up visibility change listener
  useEffect(() => {
    document.addEventListener("visibilitychange", handleVisibilityChange)
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [handleVisibilityChange])

  // Initialize visibility state
  useEffect(() => {
    setState(prev => ({ ...prev, isVisible: !document.hidden }))
  }, [])

  return state
}
