"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Camera, MessageSquare } from "lucide-react"

interface ActiveTaskProps {
  task: {
    name: string
    duration: number
    mode: "free" | "stake"
    category: string
    startTime: number
  }
  onComplete: () => void
}

export function ActiveTask({ task, onComplete }: ActiveTaskProps) {
  const [timeLeft, setTimeLeft] = useState(task.duration * 60)
  const [showProofModal, setShowProofModal] = useState(false)

  useEffect(() => {
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
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`
  }

  const progress = ((task.duration * 60 - timeLeft) / (task.duration * 60)) * 100

  return (
    <>
      <div className="border-4 border-foreground bg-card p-8 brutal-shadow-lg">
        {/* Task Info */}
        <div className="mb-8">
          <div className="mb-2 inline-block border-2 border-foreground bg-primary px-3 py-1">
            <span className="font-mono text-xs font-black uppercase text-primary-foreground">
              {task.mode === "stake" ? "💰 STAKE MODE" : "🆓 FREE MODE"}
            </span>
          </div>
          <h2 className="mb-2 font-mono text-3xl font-black uppercase md:text-4xl">{task.name}</h2>
          <p className="font-mono text-sm font-bold text-muted-foreground uppercase">
            {task.category} • {task.duration} minutes
          </p>
        </div>

        {/* Timer */}
        <div className="mb-8 text-center">
          <div className="mb-4 inline-block border-4 border-foreground bg-secondary px-12 py-8">
            <div className="font-mono text-7xl font-black tabular-nums text-secondary-foreground md:text-8xl">
              {formatTime(timeLeft)}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mx-auto max-w-2xl">
            <div className="h-8 border-4 border-foreground bg-muted">
              <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 font-mono text-sm font-bold">{Math.floor(progress)}% Complete</p>
          </div>
        </div>

        {/* Motivational Message */}
        <div className="border-l-4 border-primary bg-muted p-4">
          <p className="font-mono font-bold text-foreground">
            🔥 Stay focused! You&apos;re building discipline with every second.
          </p>
        </div>
      </div>

      {/* Proof Submission Modal */}
      {showProofModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4">
          <div className="w-full max-w-lg border-4 border-foreground bg-background p-6 brutal-shadow-lg">
            <h3 className="mb-4 font-mono text-2xl font-black uppercase">Time&apos;s Up! 🎉</h3>
            <p className="mb-6 font-mono font-bold">
              Submit proof of your work to complete this task and earn your points!
            </p>

            {/* Proof Options */}
            <div className="mb-6 grid gap-3">
              <button className="flex items-center gap-3 border-3 border-foreground bg-card p-4 font-mono font-bold hover:bg-muted">
                <Camera className="h-5 w-5" />
                Upload Photo Proof
              </button>
              <button className="flex items-center gap-3 border-3 border-foreground bg-card p-4 font-mono font-bold hover:bg-muted">
                <MessageSquare className="h-5 w-5" />
                Write Text Summary
              </button>
            </div>

            <Button
              onClick={onComplete}
              className="h-auto w-full border-4 border-foreground bg-accent py-4 font-mono text-lg font-black uppercase text-accent-foreground hover:bg-accent brutal-shadow"
            >
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Complete Task
            </Button>
          </div>
        </div>
      )}
    </>
  )
}
