"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { TaskCreationModal } from "./task-creation-modal"
import { ActiveTask } from "./active-task"
import { StatsCards } from "./stats-cards"
import { TaskHistory } from "./task-history"
import { WalletConnect } from "./wallet-connect"
import { TransactionConfirmModal } from "./transaction-confirm-modal"
import { Flame, Trophy, Target } from "lucide-react"
import { useSignAndExecuteTransaction } from "@iota/dapp-kit"
import { 
  getUserStats, 
  saveUserStats, 
  getActiveTask, 
  saveActiveTask,
  addTaskToHistory,
  updateStatsOnTaskComplete,
  checkAndResetFreeSessions,
  getWalletData,
  type TaskRecord,
} from "@/lib/storage"
import { 
  createStakeTaskTransaction, 
  createCompleteTaskTransaction, 
  createForfeitTaskTransaction,
  formatTransactionDetails
} from "@/lib/iota-client"
import { getCharityById } from "@/lib/charities"

export function Dashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [userStats, setUserStats] = useState(() => getUserStats())
  const [txConfirm, setTxConfirm] = useState<{
    isOpen: boolean
    title: string
    description: string
    details: Array<{ label: string; value: string }>
    warning?: string
    onConfirm: () => Promise<void>
  }>({
    isOpen: false,
    title: "",
    description: "",
    details: [],
    onConfirm: async () => {},
  })

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  // Load active task and wallet on mount
  useEffect(() => {
    const savedTask = getActiveTask()
    if (savedTask) {
      setActiveTask(savedTask)
    }

    const walletData = getWalletData()
    if (walletData) {
      setWalletAddress(walletData.address)
    }

    // Check and reset free sessions if new day
    checkAndResetFreeSessions()
    setUserStats(getUserStats())
  }, [])

  const handleStartTask = async (taskData: any) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    const newTask: TaskRecord = {
      id: taskId,
      name: taskData.name,
      category: taskData.category,
      duration: taskData.duration,
      mode: taskData.mode,
      stakeAmount: taskData.stakeAmount,
      charityAddress: taskData.charityId ? getCharityById(taskData.charityId)?.walletAddress : undefined,
      startTime: Date.now(),
      completed: false,
      proofSubmitted: false,
    }

    // If stake mode, create blockchain transaction
    if (taskData.mode === "stake" && taskData.stakeAmount > 0 && taskData.charityId) {
      const charity = getCharityById(taskData.charityId)
      if (!charity) {
        alert("Invalid charity selected")
        return
      }

      // Show transaction confirmation modal
      const details = formatTransactionDetails(
        'stake',
        taskData.name,
        taskData.stakeAmount,
        charity.name
      )

      setTxConfirm({
        isOpen: true,
        title: "Stake Task",
        description: "You are about to stake IOTA tokens for this task. If you fail to complete it, the stake will be donated to charity.",
        details,
        warning: "Make sure you can complete this task! Your stake will be lost if you leave the tab or fail to complete.",
        onConfirm: async () => {
          const stakeAmountNanos = (taskData.stakeAmount * 1_000_000_000).toString()
          const tx = createStakeTaskTransaction(
            taskId,
            taskData.name,
            taskData.duration,
            stakeAmountNanos,
            charity.walletAddress,
            walletAddress || ""
          )
          
          return new Promise((resolve, reject) => {
            signAndExecute(
              { transaction: tx },
              {
                onSuccess: (result) => {
                  console.log("Task staked on blockchain:", result.digest)
                  newTask.txHash = result.digest
                  setActiveTask(newTask)
                  saveActiveTask(newTask)
                  setShowTaskModal(false)
                  resolve()
                },
                onError: (error) => {
                  console.error("Failed to stake task:", error)
                  reject(error)
                }
              }
            )
          })
        }
      })
    } else if (taskData.mode === "free") {
      // Decrease free sessions
      const stats = getUserStats()
      if (stats.freeSessionsLeft <= 0) {
        alert("No free sessions left today! Use stake mode or wait until tomorrow.")
        return
      }
      stats.freeSessionsLeft -= 1
      saveUserStats(stats)
      setUserStats(stats)

      setActiveTask(newTask)
      saveActiveTask(newTask)
      setShowTaskModal(false)
    }
  }

  const handleCompleteTask = async () => {
    if (!activeTask) return

    // If stake mode, call smart contract to retrieve stake
    if (activeTask.mode === "stake" && activeTask.txHash) {
      const details = formatTransactionDetails('complete', activeTask.name)

      setTxConfirm({
        isOpen: true,
        title: "Complete Task",
        description: "Congratulations! You completed your task. Confirm this transaction to retrieve your stake.",
        details,
        onConfirm: async () => {
          const tx = createCompleteTaskTransaction(activeTask.id, walletAddress || "")
          
          return new Promise((resolve, reject) => {
            signAndExecute(
              { transaction: tx },
              {
                onSuccess: (result) => {
                  console.log("Task completed on blockchain:", result.digest)
                  finishTaskCompletion()
                  resolve()
                },
                onError: (error) => {
                  console.error("Failed to complete task:", error)
                  reject(error)
                }
              }
            )
          })
        }
      })
    } else {
      finishTaskCompletion()
    }
  }

  const finishTaskCompletion = () => {
    if (!activeTask) return

    // Update task record
    const completedTask: TaskRecord = {
      ...activeTask,
      completed: true,
      proofSubmitted: true,
      endTime: Date.now(),
    }

    // Update stats
    updateStatsOnTaskComplete(activeTask.stakeAmount)
    
    // Save to history
    addTaskToHistory(completedTask)
    
    // Clear active task
    setActiveTask(null)
    saveActiveTask(null)
    
    // Refresh stats
    setUserStats(getUserStats())
  }

  const handleForfeitTask = async () => {
    if (!activeTask) return

    // If stake mode, call smart contract to forfeit
    if (activeTask.mode === "stake" && activeTask.txHash) {
      const details = formatTransactionDetails('forfeit', activeTask.name)

      setTxConfirm({
        isOpen: true,
        title: "Forfeit Task",
        description: "You are about to forfeit this task. Your stake will be donated to the selected charity.",
        details,
        warning: "This action cannot be undone. Your stake will be permanently donated.",
        onConfirm: async () => {
          const tx = createForfeitTaskTransaction(activeTask.id, walletAddress || "")
          
          return new Promise((resolve, reject) => {
            signAndExecute(
              { transaction: tx },
              {
                onSuccess: (result) => {
                  console.log("Task forfeited on blockchain:", result.digest)
                  finishTaskForfeit()
                  resolve()
                },
                onError: (error) => {
                  console.error("Failed to forfeit task:", error)
                  // Continue anyway to clear local state
                  finishTaskForfeit()
                  reject(error)
                }
              }
            )
          })
        }
      })
    } else {
      finishTaskForfeit()
    }
  }

  const finishTaskForfeit = () => {
    if (!activeTask) return

    // Update task record
    const forfeitedTask: TaskRecord = {
      ...activeTask,
      completed: false,
      proofSubmitted: false,
      endTime: Date.now(),
    }

    // Save to history
    addTaskToHistory(forfeitedTask)
    
    // Reset streak on forfeit
    const stats = getUserStats()
    stats.streakCount = 0
    saveUserStats(stats)
    
    // Clear active task
    setActiveTask(null)
    saveActiveTask(null)
    
    // Refresh stats
    setUserStats(getUserStats())
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <header className="mb-8 border-4 border-foreground bg-card p-6 brutal-shadow">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="mb-1 font-mono text-3xl font-black uppercase tracking-tight md:text-4xl">
                Study Stake
              </h1>
              <p className="font-mono text-sm font-bold text-muted-foreground">BUILD YOUR ACCOUNTABILITY</p>
            </div>
            <div className="flex gap-3">
              <WalletConnect 
                onConnect={setWalletAddress}
                onDisconnect={() => setWalletAddress(null)}
              />
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
          <ActiveTask 
            task={activeTask} 
            onComplete={handleCompleteTask}
            onForfeit={handleForfeitTask}
          />
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
            walletConnected={!!walletAddress}
          />
        )}

        {/* Transaction Confirmation Modal */}
        <TransactionConfirmModal
          isOpen={txConfirm.isOpen}
          onClose={() => setTxConfirm({ ...txConfirm, isOpen: false })}
          onConfirm={txConfirm.onConfirm}
          title={txConfirm.title}
          description={txConfirm.description}
          details={txConfirm.details}
          warning={txConfirm.warning}
        />
      </div>
    </div>
  )
}
