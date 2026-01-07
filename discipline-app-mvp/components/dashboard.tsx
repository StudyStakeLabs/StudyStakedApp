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
  getDefaultStats,
  type TaskRecord,
} from "@/lib/storage"
import {
  createStakeTaskTransaction,
  createCompleteTaskTransaction,
  createForfeitTaskTransaction,
  formatTransactionDetails,
  getUserTasks
} from "@/lib/iota-client"
import { getCharityById } from "@/lib/charities"

import { NftRewardCard } from "./nft-reward-card"
import { Leaderboard } from "./leaderboard"


export function Dashboard() {
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [activeTask, setActiveTask] = useState<TaskRecord | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  // Fix hydration mismatch: Always initialize with defaults, load from storage in useEffect
  const [userStats, setUserStats] = useState(() => getDefaultStats())
  const [recentCompletedTask, setRecentCompletedTask] = useState<TaskRecord | null>(null)

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
    onConfirm: async () => { },
  })

  const { mutate: signAndExecute } = useSignAndExecuteTransaction()

  // Load active task and wallet on mount
  useEffect(() => {
    const savedTask = getActiveTask()
    if (savedTask) {
      setActiveTask(savedTask)
    }

    const loadWalletAndTasks = async () => {
      const walletData = getWalletData()
      if (walletData) {
        setWalletAddress(walletData.address)

        // Sync tasks from blockchain
        console.log("Syncing tasks from blockchain...")
        try {
          const chainTasks = await getUserTasks(walletData.address)
          console.log("Fetched chain tasks:", chainTasks)

          // HEAL LOGIC: If we have an active task but valid Object ID is missing, try to find it
          const currentLocalTask = getActiveTask()
          if (currentLocalTask && !currentLocalTask.objectId && currentLocalTask.txHash) {
            console.log("Attempting to heal active task Object ID...")
            const matchingTask = chainTasks.find(t => t.name === currentLocalTask.id)
            if (matchingTask) {
              console.log("Found matching on-chain task! Healing Object ID:", matchingTask.id)
              const updatedTask = { ...currentLocalTask, objectId: matchingTask.id }
              setActiveTask(updatedTask)
              saveActiveTask(updatedTask)
            } else {
              console.warn("Could not find on-chain object for active task.")
            }
          }
        } catch (e) {
          console.error("Failed to sync tasks:", e)
        }
      }
    }
    loadWalletAndTasks()

    // Check and reset free sessions if new day
    checkAndResetFreeSessions()
    setUserStats(getUserStats())
  }, [])

  const handleStartTask = async (taskData: any) => {
    const taskId = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Default config for tasks
    const charity = taskData.charityId ? getCharityById(taskData.charityId) : getCharityById("khan-academy")!

    // Safety check for charity
    if (!charity) {
      console.error("No charity found for id:", taskData.charityId)
      alert("System Error: Invalid Charity")
      return
    }

    const newTask: TaskRecord = {
      id: taskId,
      name: taskData.name,
      category: taskData.category,
      duration: taskData.duration,
      mode: taskData.mode,
      stakeAmount: taskData.mode === "stake" ? taskData.stakeAmount : 0,
      charityAddress: charity.walletAddress,
      startTime: Date.now(),
      completed: false,
      proofSubmitted: false,
    }

    // Determine Stake Amount (0 for free mode)
    // NOTE: Contract likely causes MoveAbort(4) if stake is 0 or dust. Using 1000 nanos for "Free" mode.
    const stakeAmountNanos = taskData.mode === "stake"
      ? (taskData.stakeAmount * 1_000_000_000).toString()
      : "1000"

    // Show transaction confirmation modal for BOTH modes
    // Free mode still needs a transaction to record the task on-chain

    const details = formatTransactionDetails(
      'stake',
      taskData.name
    )
    details.push({ label: "Stake Amount", value: `${taskData.mode === "stake" ? taskData.stakeAmount : 0} IOTA` })

    setTxConfirm({
      isOpen: true,
      title: taskData.mode === "stake" ? "Stake Task" : "Start Free Task (On-Chain)",
      description: taskData.mode === "stake"
        ? "You are about to stake IOTA tokens. If you fail, the stake is donated."
        : "You are starting a Free Mode task. Simply sign to record your commitment on-chain (Gas fees apply).",
      details,
      warning: "Make sure you can complete this task! Leaving the tab will result in failure.",
      onConfirm: async () => {
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
            {
              transaction: tx as any,
              options: { showObjectChanges: true }
            },
            {
              onSuccess: async (result) => {
                console.log("Task created on blockchain:", result.digest)
                newTask.txHash = result.digest

                // RELIABLE STRATEGY: Fetch the Object ID by querying the chain for this user's tasks
                // We wait a brief moment for the node to index the new object
                console.log("Waiting for node to index new object...")
                setTimeout(async () => {
                  if (!walletAddress) return

                  try {
                    console.log("Fetching user tasks to find new object...")
                    const tasks = await getUserTasks(walletAddress)
                    const foundTask = tasks.find(t => t.name === newTask.id)

                    if (foundTask) {
                      console.log("Confirmed on-chain creation. Object ID:", foundTask.id)
                      newTask.objectId = foundTask.id

                      // Update state with the robust ID
                      setActiveTask(newTask)
                      saveActiveTask(newTask)
                    } else {
                      console.warn("Could not find new task on-chain yet. It may take a moment to appear.")
                      // Fallback: The useEffect healer will catch it on refresh, 
                      // or the upcoming poll interval in Dashboard could catch it.
                    }
                  } catch (e) {
                    console.error("Failed to fetch new task object:", e)
                  }
                }, 2000)

                // If free mode, consume session logic locally
                if (taskData.mode === "free") {
                  const stats = getUserStats()
                  stats.freeSessionsLeft = Math.max(0, stats.freeSessionsLeft - 1)
                  saveUserStats(stats)
                  setUserStats(stats)
                }

                // Set active task immediately (even if ID is pending) so UI updates
                setActiveTask(newTask)
                saveActiveTask(newTask)
                setShowTaskModal(false)
                resolve()
              },
              onError: (error) => {
                console.error("Failed to start task:", error)
                reject(error)
              }
            }
          )
        })
      }
    })
  }

  const handleCompleteTask = async (proofHash?: string) => {
    if (!activeTask) return

    // All tasks are now on-chain, so they all have a txHash
    if (activeTask.txHash) {
      // Use the captured Object ID if available, otherwise fallback (which will likely fail but prevents crash here)
      const targetObjectId = activeTask.objectId || activeTask.id

      const details = formatTransactionDetails('complete', activeTask.name)
      if (proofHash) {
        details.push({ label: "Proof Hash", value: proofHash.substring(0, 16) + "..." })
      }

      setTxConfirm({
        isOpen: true,
        title: "Complete Task & Mint Reward",
        description: "Congratulations! Confirm to record your success on-chain and receive your result.",
        details,
        onConfirm: async () => {
          const tx = createCompleteTaskTransaction(targetObjectId, walletAddress || "")

          return new Promise((resolve, reject) => {
            signAndExecute(
              { transaction: tx as any },
              {
                onSuccess: (result) => {
                  console.log("Task completed on blockchain:", result.digest)
                  finishTaskCompletion(proofHash)
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
      // Fallback for legacy local tasks
      finishTaskCompletion(proofHash)
    }
  }

  const finishTaskCompletion = (proofHash?: string) => {
    if (!activeTask) return

    // Update task record
    const completedTask: TaskRecord = {
      ...activeTask,
      completed: true,
      proofSubmitted: true,
      proofHash: proofHash,
      endTime: Date.now(),
    }

    // Update stats
    updateStatsOnTaskComplete(activeTask.stakeAmount)

    // Save to history
    addTaskToHistory(completedTask)

    // Trigger NFT Reward
    setRecentCompletedTask(completedTask)

    // Clear active task
    setActiveTask(null)
    saveActiveTask(null)

    // Refresh stats
    setUserStats(getUserStats())
  }

  const handleForfeitTask = async () => {
    if (!activeTask) return

    // All tasks on-chain
    if (activeTask.txHash) {
      // Use the captured Object ID if available
      const targetObjectId = activeTask.objectId || activeTask.id

      const details = formatTransactionDetails('forfeit', activeTask.name)

      setTxConfirm({
        isOpen: true,
        title: "Forfeit Task",
        description: activeTask.mode === "stake"
          ? "You are forfeiting. Stake will be donated."
          : "You are forfeiting. This will be recorded on-chain.",
        details,
        warning: activeTask.mode === "stake" ? "Stake lost permanently." : undefined,
        onConfirm: async () => {
          const tx = createForfeitTaskTransaction(targetObjectId, walletAddress || "")

          return new Promise((resolve, reject) => {
            signAndExecute(
              { transaction: tx as any },
              {
                onSuccess: (result) => {
                  console.log("Task forfeited on blockchain:", result.digest)
                  finishTaskForfeit()
                  resolve()
                },
                onError: (error) => {
                  // If error (e.g. user rejected), still force local forfeit so they don't get stuck
                  console.error("Failed to forfeit task:", error)
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

            {/* Leaderboard */}
            <div className="mt-8">
              <Leaderboard />
            </div>
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

        {/* NFT Reward Modal */}
        {recentCompletedTask && (
          <NftRewardCard
            taskName={recentCompletedTask.name}
            duration={recentCompletedTask.duration}
            mode={recentCompletedTask.mode}
            txHash={recentCompletedTask.txHash}
            proofHash={recentCompletedTask.proofHash}
            onClose={() => setRecentCompletedTask(null)}
          />
        )}
      </div>
    </div>
  )
}
