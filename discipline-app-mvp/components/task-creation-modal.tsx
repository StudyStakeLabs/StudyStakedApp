"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { X, Clock, DollarSign, BookOpen, Briefcase, Heart, Home, Lightbulb } from "lucide-react"
import { CharitySelector } from "./charity-selector"
import { CHARITIES } from "@/lib/charities"

interface TaskCreationModalProps {
  onClose: () => void
  onStart: (taskData: any) => void
  freeSessionsLeft: number
  walletConnected: boolean
}

const CATEGORIES = [
  { id: "study", label: "Study", icon: BookOpen },
  { id: "work", label: "Work", icon: Briefcase },
  { id: "health", label: "Health", icon: Heart },
  { id: "chores", label: "Chores", icon: Home },
  { id: "personal", label: "Personal", icon: Lightbulb },
]

const DURATIONS = [
  { value: 10, label: "10 min" },
  { value: 25, label: "25 min" },
  { value: 45, label: "45 min" },
  { value: 60, label: "1 hour" },
  { value: 120, label: "2 hours" },
]

export function TaskCreationModal({ onClose, onStart, freeSessionsLeft, walletConnected }: TaskCreationModalProps) {
  const [taskName, setTaskName] = useState("")
  const [category, setCategory] = useState("study")
  const [duration, setDuration] = useState(25)
  const [mode, setMode] = useState<"free" | "stake">("free")
  const [stakeAmount, setStakeAmount] = useState(1)
  const [selectedCharity, setSelectedCharity] = useState(CHARITIES[0].id)
  const [isCreating, setIsCreating] = useState(false)

  const handleStart = async () => {
    if (!taskName.trim()) return
    
    if (mode === "stake" && !walletConnected) {
      alert("Please connect your wallet to use stake mode!")
      return
    }

    setIsCreating(true)

    try {
      await onStart({
        name: taskName,
        category,
        duration,
        mode,
        stakeAmount: mode === "stake" ? stakeAmount : 0,
        charityId: selectedCharity,
      })
    } catch (error) {
      console.error("Failed to start task:", error)
      alert("Failed to start task. Please try again.")
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/80 p-4">
      <div className="w-full max-w-2xl border-4 border-foreground bg-background p-6 brutal-shadow-lg">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-mono text-2xl font-black uppercase">Create Task</h2>
          <button onClick={onClose} className="border-2 border-foreground p-2 hover:bg-muted">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Task Name */}
        <div className="mb-6">
          <label className="mb-2 block font-mono text-sm font-bold uppercase">Task Name</label>
          <input
            type="text"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
            placeholder="What will you focus on?"
            className="w-full border-4 border-foreground bg-card px-4 py-3 font-mono font-bold focus:outline-none focus:ring-4 focus:ring-ring"
          />
        </div>

        {/* Category */}
        <div className="mb-6">
          <label className="mb-2 block font-mono text-sm font-bold uppercase">Category</label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon
              return (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={`border-3 border-foreground p-3 font-mono text-xs font-bold uppercase transition-colors ${
                    category === cat.id ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
                  }`}
                >
                  <Icon className="mx-auto mb-1 h-5 w-5" />
                  {cat.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Duration */}
        <div className="mb-6">
          <label className="mb-2 block font-mono text-sm font-bold uppercase">Duration</label>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-5">
            {DURATIONS.map((d) => (
              <button
                key={d.value}
                onClick={() => setDuration(d.value)}
                className={`border-3 border-foreground px-3 py-2 font-mono text-sm font-bold transition-colors ${
                  duration === d.value ? "bg-secondary text-secondary-foreground" : "bg-card hover:bg-muted"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        {/* Mode Selection */}
        <div className="mb-6">
          <label className="mb-2 block font-mono text-sm font-bold uppercase">Mode</label>
          <div className="grid gap-3 sm:grid-cols-2">
            <button
              onClick={() => setMode("free")}
              className={`border-4 border-foreground p-4 text-left transition-colors ${
                mode === "free" ? "bg-accent text-accent-foreground" : "bg-card hover:bg-muted"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                <span className="font-mono font-black uppercase">Free Mode</span>
              </div>
              <p className="font-mono text-xs font-bold opacity-90">{freeSessionsLeft} sessions left today</p>
            </button>

            <button
              onClick={() => setMode("stake")}
              disabled={!walletConnected}
              className={`border-4 border-foreground p-4 text-left transition-colors disabled:opacity-50 ${
                mode === "stake" ? "bg-primary text-primary-foreground" : "bg-card hover:bg-muted"
              }`}
            >
              <div className="mb-1 flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                <span className="font-mono font-black uppercase">Stake Mode</span>
              </div>
              <p className="font-mono text-xs font-bold opacity-90">Put money on the line</p>
            </button>
          </div>
        </div>

        {/* Stake Amount (if stake mode) */}
        {mode === "stake" && (
          <>
            <div className="mb-6">
              <label className="mb-2 block font-mono text-sm font-bold uppercase">Stake Amount (IOTA)</label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(Number(e.target.value))}
                className="w-full border-4 border-foreground bg-card px-4 py-3 font-mono text-lg font-bold focus:outline-none focus:ring-4 focus:ring-ring"
              />
              <p className="mt-2 font-mono text-xs font-bold text-muted-foreground">
                Fail → Donated to charity | Success → 100% returned
              </p>
              {!walletConnected && (
                <p className="mt-2 font-mono text-xs font-bold text-destructive">
                  ⚠️ Connect wallet to use stake mode
                </p>
              )}
            </div>

            <div className="mb-6">
              <CharitySelector selectedCharityId={selectedCharity} onSelect={setSelectedCharity} />
            </div>
          </>
        )}

        {/* Start Button */}
        <Button
          onClick={handleStart}
          disabled={!taskName.trim() || isCreating || (mode === "stake" && !walletConnected)}
          className="h-auto w-full border-4 border-foreground bg-primary py-4 font-mono text-xl font-black uppercase text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:bg-primary disabled:opacity-50 brutal-shadow transition-transform"
        >
          {isCreating ? "Creating Task..." : "Start Task"}
        </Button>
      </div>
    </div>
  )
}
