"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, AlertTriangle, Fingerprint, Keyboard, MousePointer2 } from "lucide-react"
import { useTabVisibility } from "@/hooks/use-tab-visibility"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import SHA256 from "crypto-js/sha256"

// --- Level 1: Friction / Activity Config ---
const IDLE_WARNING_MS = 60 * 1000 // 1 minute
const IDLE_FORFEIT_MS = 120 * 1000 // 2 minutes

// --- Level 3: Checkpoint Config ---
const CHECKPOINT_MIN_INTERVAL = 3 * 60 * 1000 // 3 mins
const CHECKPOINT_MAX_INTERVAL = 7 * 60 * 1000 // 7 mins
const CHECKPOINT_TIMEOUT = 30 * 1000 // 30 seconds to click

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
  onComplete: (proofHash?: string) => void
  onForfeit?: () => void
}

export function ActiveTask({ task, onComplete, onForfeit }: ActiveTaskProps) {
  const [timeLeft, setTimeLeft] = useState(task.duration * 60)
  const [showProofModal, setShowProofModal] = useState(false)
  const [tabWarningShown, setTabWarningShown] = useState(false)
  const [forfeited, setForfeited] = useState(false)
  const [forfeitReason, setForfeitReason] = useState<string>("")

  // Level 1: Activity Tracking State
  const lastActivityRef = useRef(Date.now())
  const [showIdleWarning, setShowIdleWarning] = useState(false)

  // Level 2: Proof State
  const [proofText, setProofText] = useState("")

  // Level 3: Checkpoint State
  const [showCheckpoint, setShowCheckpoint] = useState(false)
  const [checkpointTimer, setCheckpointTimer] = useState<NodeJS.Timeout | null>(null)

  // Helpers
  const triggerForfeit = useCallback((reason: string) => {
    if (forfeited) return

    setForfeited(true)
    setForfeitReason(reason)
    onForfeit?.()
  }, [forfeited, onForfeit])

  // --- Level 1: Tab Visibility & Activity ---
  useTabVisibility({
    warningThreshold: 20,
    forfeitThreshold: 30,
    onWarning: () => {
      if (!tabWarningShown && !forfeited) {
        setTabWarningShown(true)
        notify("⚠️ StudyStake Warning", "Come back to your task or your stake will be donated!")
      }
    },
    onForfeit: () => triggerForfeit("Left tab for too long"),
  })

  // Activity Listeners
  useEffect(() => {
    const handleActivity = () => {
      lastActivityRef.current = Date.now()
      if (showIdleWarning) setShowIdleWarning(false)
    }

    window.addEventListener("mousemove", handleActivity)
    window.addEventListener("keydown", handleActivity)

    // Check idle status loop
    const idleCheck = setInterval(() => {
      if (forfeited || showProofModal || showCheckpoint || timeLeft <= 0) return

      const idleTime = Date.now() - lastActivityRef.current
      if (idleTime > IDLE_FORFEIT_MS) {
        triggerForfeit("No mouse/keyboard activity detected for too long")
      } else if (idleTime > IDLE_WARNING_MS) {
        setShowIdleWarning(true)
      }
    }, 1000)

    return () => {
      window.removeEventListener("mousemove", handleActivity)
      window.removeEventListener("keydown", handleActivity)
      clearInterval(idleCheck)
    }
  }, [forfeited, showProofModal, showCheckpoint, timeLeft, triggerForfeit, showIdleWarning])

  // --- Level 3: Random Checkpoints ---
  useEffect(() => {
    if (forfeited || timeLeft <= 0 || showProofModal) return

    const scheduleCheckpoint = () => {
      const delay = Math.random() * (CHECKPOINT_MAX_INTERVAL - CHECKPOINT_MIN_INTERVAL) + CHECKPOINT_MIN_INTERVAL
      // For demo purposes, if task is short, just force one? 
      // User requested "Every 3-7 mins". If duration < 3 mins, maybe skip?
      // Let's implement strict scheduling.

      const timer = setTimeout(() => {
        if (!document.hidden && !showProofModal && timeLeft > 60) { // Don't show if almost done
          setShowCheckpoint(true)

          // Fail if not clicked in 30s
          const failTimer = setTimeout(() => {
            triggerForfeit("Failed to verify presence (Anti-AFK)")
          }, CHECKPOINT_TIMEOUT)
          setCheckpointTimer(failTimer)
        } else {
          scheduleCheckpoint() // Try again later
        }
      }, delay)

      return timer
    }

    const timerId = scheduleCheckpoint()
    return () => clearTimeout(timerId)
  }, [timeLeft, showProofModal, forfeited, triggerForfeit])

  const handleCheckpointVerify = () => {
    setShowCheckpoint(false)
    if (checkpointTimer) clearTimeout(checkpointTimer)
  }

  // --- Main Timer ---
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

  // Notification helper
  const notify = (title: string, body: string) => {
    if ("Notification" in window && Notification.permission === "granted") {
      new Notification(title, { body, icon: "/icon.png" })
    }
  }

  // Permission request
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

  // Handle Proof Submission
  const handleSubmitProof = () => {
    if (!proofText.trim()) return
    const hash = SHA256(proofText).toString()
    onComplete(hash)
  }

  if (forfeited) {
    return (
      <div className="mb-8 border-4 border-destructive bg-destructive/10 p-8 text-center brutal-shadow">
        <AlertTriangle className="mx-auto mb-4 h-16 w-16 text-destructive" />
        <h2 className="mb-2 font-mono text-2xl font-black uppercase text-destructive">Task Forfeited</h2>
        <p className="font-mono font-bold mb-2">{forfeitReason || "You failed the discipline check."}</p>
        <p className="font-mono text-sm">
          {task.mode === "stake" ? "Your stake has been donated to charity." : "Try better next time!"}
        </p>
      </div>
    )
  }

  return (
    <div className="mb-8 border-4 border-foreground bg-card p-6 brutal-shadow relative overflow-hidden">
      {/* Level 3 Checkpoint Overlay */}
      <Dialog open={showCheckpoint}>
        <DialogContent className="border-4 border-foreground bg-secondary sm:max-w-md" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-mono text-2xl font-black uppercase">Startle Check!</DialogTitle>
            <DialogDescription className="font-mono font-bold text-foreground">
              Are you still focusing? Click verify within 30 seconds.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center py-6">
            <Button
              onClick={handleCheckpointVerify}
              className="h-16 w-full text-xl font-black uppercase border-4 border-foreground bg-primary text-primary-foreground hover:bg-primary/90"
            >
              I'm Still Here!
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Level 2 Proof Modal */}
      <Dialog open={showProofModal}>
        <DialogContent className="border-4 border-foreground bg-background sm:max-w-lg" onPointerDownOutside={(e) => e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="font-mono text-2xl font-black uppercase">Time's Up! Submit Proof</DialogTitle>
            <DialogDescription className="font-mono">
              Show us what you did. This will be hashed and verified.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="proof-text" className="font-mono font-bold">What did you accomplish?</Label>
              <Textarea
                id="proof-text"
                placeholder="I wrote 300 words about..."
                value={proofText}
                onChange={(e) => setProofText(e.target.value)}
                className="border-2 border-foreground font-mono min-h-[150px]"
              />
              <p className="text-xs text-muted-foreground font-mono">
                Hash: {proofText ? SHA256(proofText).toString().substring(0, 20) + "..." : "Waiting for input..."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSubmitProof} disabled={!proofText.trim()} className="w-full border-2 border-foreground font-bold">
              <Fingerprint className="mr-2 h-4 w-4" />
              Sign & Complete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="mb-4">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-mono text-sm font-bold uppercase text-muted-foreground">{task.category}</span>
          <span className="font-mono text-xs font-bold uppercase text-primary">
            {task.mode === "stake" ? `${task.stakeAmount} IOTA` : "Free"}
          </span>
        </div>
        <h2 className="mb-4 font-mono text-3xl font-black uppercase">{task.name}</h2>

        {/* Level 1 Idle Warning */}
        {showIdleWarning && (
          <Alert className="mb-4 border-2 border-yellow-500 bg-yellow-500/10 animate-pulse">
            <MousePointer2 className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="font-mono text-xs font-bold text-yellow-700">
              Movement needed! We haven't detected activity in a while. Move mouse or type to avoid forfeit.
            </AlertDescription>
          </Alert>
        )}

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
            {timeLeft === 0 ? "Session End" : "Keep focused!"}
          </p>
        </div>

        {/* Give Up Button */}
        {timeLeft > 0 && !showProofModal && (
          <div className="mb-6 flex justify-center">
            <Button
              variant="destructive"
              onClick={() => triggerForfeit("User manually stopped the task")}
              className="border-2 border-destructive font-mono font-bold hover:bg-destructive/90"
            >
              <AlertTriangle className="mr-2 h-4 w-4" />
              Give Up
            </Button>
          </div>
        )}

        {/* Warning if tab tracking active */}
        {task.mode === "stake" && (
          <div className="flex flex-col gap-2">
            <Alert className="border-2 border-destructive/50">
              <AlertTriangle className="h-5 w-5" />
              <AlertDescription className="font-mono text-xs font-bold">
                Level 1: Friction Proof Active (Tab + Activity)
              </AlertDescription>
            </Alert>
          </div>
        )}
      </div>
    </div>
  )
}
