"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle } from "lucide-react"
import { useTabVisibility } from "@/hooks/use-tab-visibility"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface ActiveTaskProps {
  task: {
    id: string
    name: string
    duration: number
    mode: "free" | "stake"
    category: string
    startTime: number
    stakeAmount?: number
    charityId?: string
  }
  onComplete: () => void
  onForfeit?: () => void
}

export function ActiveTask({ task, onComplete, onForfeit }: ActiveTaskProps) {
  const [timeLeft, setTimeLeft] = useState(task.duration * 60)
  const [showProofModal, setShowProofModal] = useState(false)
  const [tabWarningShown, setTabWarningShown] = useState(false)
  const [forfeited, setForfeited] = useState(false)

  // Tab visibility tracking
  useTabVisibility({
    warningThreshold: 20,
    forfeitThreshold: 30,
    onWarning: () => {
      if (!tabWarningShown && !forfeited) {
        setTabWarningShown(true)
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("⚠️ StudyStake Warning", {
            body: "Come back to your task or your stake will be donated!",
            icon: "/icon.png",
          })
        }
      }
    },
    onForfeit: () => {
      if (task.mode === "stake" && !forfeited) {
        setForfeited(true)
        onForfeit?.()
      }
    },
  })

  // Timer countdown
  useEffect(() => {
    if (forfeited) return

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval)
          setShowProofModal(true)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [forfeited])

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission()
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((task.duration * 60 - timeLeft) / (task.duration * 60)) * 100

  if (forfeited) {
    return (
      <div className="mb-8 border-4 border-destructive bg-destructive/10 p-8 text-center">
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-destructive" />
        <h2 className="mb-2 font-mono text-2xl font-black uppercase text-destructive">Task Forfeited</h2>
        <p className="font-mono font-bold">You left the tab for too long. Stake donated to charity.</p>
      </div>
    )
  }

  return (
    <div className="mb-8 border-4 border-foreground bg-card p-6 brutal-shadow">
      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-sm font-bold uppercase text-muted-foreground">{task.category}</span>
          <span className="font-mono text-xs font-bold uppercase text-primary">
            {task.mode === "stake" ? `${task.stakeAmount} IOTA` : "Free"}
          </span>
        </div>
        <h2 className="mb-4 font-mono text-3xl font-black uppercase">{task.name}</h2>

        {/* Progress Bar */}
        <div className="mb-4 h-8 border-4 border-foreground bg-muted">
          <div
            className="h-full bg-primary transition-all duration-1000"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Timer */}
        <div className="mb-6 text-center">
          <div className="font-mono text-6xl font-black">{formatTime(timeLeft)}</div>
          <p className="mt-2 font-mono text-sm font-bold text-muted-foreground">
            {timeLeft === 0 ? "Time's up!" : "Keep focused!"}
          </p>
        </div>

        {/* Warning if tab tracking active */}
        {task.mode === "stake" && (
          <Alert className="mb-4 border-2 border-destructive">
            <AlertTriangle className="h-5 w-5" />
            <AlertDescription className="font-mono text-xs font-bold">
              Tab tracking active: Stay on this page or forfeit your stake
            </AlertDescription>
          </Alert>
        )}

        {/* Complete Button */}
        {timeLeft === 0 && (
          <Button
            onClick={onComplete}
            className="h-auto w-full border-4 border-foreground bg-primary py-4 font-mono text-xl font-black uppercase text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:bg-primary brutal-shadow transition-transform"
          >
            <CheckCircle2 className="mr-2 h-6 w-6" />
            Complete Task
          </Button>
        )}
      </div>
    </div>
  )
}
