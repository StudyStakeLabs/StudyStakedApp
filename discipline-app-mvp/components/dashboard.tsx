"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { TaskCreationModal } from "./task-creation-modal"
import { ActiveTask } from "./active-task"
import { StatsCards } from "./stats-cards"
import { TaskHistory } from "./task-history"
import { Flame, Trophy, Target } from "lucide-react"

export function Dashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [activeTask, setActiveTask] = useState<{
    name: string
    duration: number
    mode: "free" | "stake"
    category: string
    startTime: number
  } | null>(null)

  // Mock data - in real app, this would come from state management
  const userStats = {
    freeSessionsLeft: 2,
    streakCount: 5,
    disciplineScore: 342,
    totalCompleted: 23,
  }

  const handleStartTask = (taskData: any) => {
    setActiveTask({
      ...taskData,
      startTime: Date.now(),
    })
    setShowTaskModal(false)
  }

  const handleCompleteTask = () => {
    setActiveTask(null)
    // In real app, update stats here
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 border-4 border-foreground bg-card p-6 brutal-shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-1 font-mono text-3xl font-black uppercase tracking-tight md:text-4xl">
                Proof of Discipline
              </h1>
              <p className="font-mono text-sm font-bold text-muted-foreground">BUILD YOUR ACCOUNTABILITY</p>
            </div>
            <div className="flex gap-3">
              <div className="flex items-center gap-2 border-3 border-foreground bg-secondary px-4 py-2">
                <Flame className="h-5 w-5" />
                <span className="font-mono text-lg font-black">{userStats.streakCount}</span>
              </div>
              <div className="flex items-center gap-2 border-3 border-foreground bg-primary px-4 py-2 text-primary-foreground">
                <Trophy className="h-5 w-5" />
                <span className="font-mono text-lg font-black">{userStats.disciplineScore}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Active Task or Stats */}
        {activeTask ? (
          <ActiveTask task={activeTask} onComplete={handleCompleteTask} />
        ) : (
          <>
            <StatsCards stats={userStats} />

            {/* Create Task Button */}
            <div className="mb-8">
              <Button
                onClick={() => setShowTaskModal(true)}
                className="h-auto w-full border-4 border-foreground bg-primary py-6 font-mono text-xl font-black uppercase tracking-wide text-primary-foreground hover:translate-x-1 hover:translate-y-1 hover:bg-primary brutal-shadow transition-transform"
              >
                <Target className="mr-2 h-6 w-6" />
                Start New Task
              </Button>
            </div>

            {/* Task History */}
            <TaskHistory />
          </>
        )}

        {/* Task Creation Modal */}
        {showTaskModal && (
          <TaskCreationModal
            onClose={() => setShowTaskModal(false)}
            onStart={handleStartTask}
            freeSessionsLeft={userStats.freeSessionsLeft}
          />
        )}
      </div>
    </div>
  )
}
