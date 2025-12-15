/**
 * IOTA Move Smart Contract Integration
 * Handles interactions with the StudyStake Move module on IOTA Testnet
 */

import { IotaClient, getFullnodeUrl } from "@iota/iota-sdk/client"
import { Transaction } from "@iota/iota-sdk/transactions"

// Smart Contract Configuration
export const PACKAGE_ID = process.env.NEXT_PUBLIC_PACKAGE_ID!
export const TASK_REGISTRY_ID = process.env.NEXT_PUBLIC_TASK_REGISTRY_ID!

// IOTA Testnet Configuration
export const IOTA_TESTNET_RPC = getFullnodeUrl("testnet")
export const IOTA_EXPLORER_URL = "https://explorer.iota.cafe"

// Create IOTA client instance
export const iotaClient = new IotaClient({ url: IOTA_TESTNET_RPC })

/**
 * Create transaction for staking a task
 * @param taskId - Unique task identifier
 * @param taskName - Name/description of the task
 * @param durationMinutes - Task duration in minutes
 * @param stakeAmount - Amount to stake in IOTA (in NANOS - 1 IOTA = 1,000,000,000 NANOS)
 * @param charityAddress - Address to receive funds if task is forfeited
 * @param userAddress - User's wallet address
 * @returns Transaction object ready to be signed
 */
export function createStakeTaskTransaction(
  taskId: string,
  taskName: string,
  durationMinutes: number,
  stakeAmount: string,
  charityAddress: string,
  userAddress: string
) {
  const tx = new Transaction()

  // Split coins for the stake amount
  const [stakeCoin] = tx.splitCoins(tx.gas, [stakeAmount])

  // Call the stake_task Move function
  tx.moveCall({
    target: `${PACKAGE_ID}::studystake::stake_task`,
    arguments: [
      tx.pure.string(taskId), // task_id
      tx.pure.u64(durationMinutes), // duration_minutes
      tx.pure.address(charityAddress), // charity_address
      stakeCoin, // stake (Coin<IOTA>)
      tx.object("0x6"), // clock: &Clock
    ],
  })

  return tx
}

/**
 * Create transaction for completing a task
 * @param taskId - The task object ID to complete
 * @param userAddress - User's wallet address
 * @returns Transaction object ready to be signed
 */
export function createCompleteTaskTransaction(taskId: string, userAddress: string) {
  const tx = new Transaction()

  // Call the complete_task Move function
  tx.moveCall({
    target: `${PACKAGE_ID}::studystake::complete_task`,
    arguments: [
      tx.object(taskId), // task: Task object
      tx.object("0x6"), // clock: &Clock
    ],
  })

  return tx
}

/**
 * Create transaction for forfeiting a task
 * @param taskId - The task object ID to forfeit
 * @param userAddress - User's wallet address
 * @returns Transaction object ready to be signed
 */
export function createForfeitTaskTransaction(taskId: string, userAddress: string) {
  const tx = new Transaction()

  // Call the forfeit_task Move function
  tx.moveCall({
    target: `${PACKAGE_ID}::studystake::forfeit_task`,
    arguments: [
      tx.object(taskId), // task: Task object
    ],
  })

  return tx
}

/**
 * Get task details from the blockchain
 * @param taskId - The task object ID
 * @returns Task details or null if not found
 */
export async function getTaskDetails(taskId: string) {
  try {
    const object = await iotaClient.getObject({
      id: taskId,
      options: {
        showContent: true,
        showOwner: true,
      },
    })

    if (!object.data || object.data.content?.dataType !== "moveObject") {
      return null
    }

    const fields = (object.data.content as any).fields
    return {
      id: taskId,
      name: fields.task_id,
      staker: fields.staker,
      stakeAmount: fields.stake_amount,
      charityAddress: fields.charity_address,
      startTime: fields.start_time_ms,
      durationMinutes: fields.duration_minutes,
      deadlineMs: fields.deadline_ms,
      isActive: fields.is_active,
      createdAt: fields.created_at,
    }
  } catch (error) {
    console.error("Failed to get task details:", error)
    return null
  }
}

/**
 * Get all tasks for a specific user
 * @param userAddress - User's wallet address
 * @returns Array of task objects
 */
export async function getUserTasks(userAddress: string) {
  try {
    const objects = await iotaClient.getOwnedObjects({
      owner: userAddress,
      filter: {
        StructType: `${PACKAGE_ID}::studystake::Task`,
      },
      options: {
        showContent: true,
      },
    })

    return objects.data
      .filter((obj) => obj.data?.content?.dataType === "moveObject")
      .map((obj) => {
        const fields = (obj.data!.content as any).fields
        return {
          id: obj.data!.objectId,
          name: fields.task_id,
          staker: fields.staker,
          stakeAmount: fields.stake_amount,
          charityAddress: fields.charity_address,
          startTime: fields.start_time_ms,
          durationMinutes: fields.duration_minutes,
          deadlineMs: fields.deadline_ms,
          isActive: fields.is_active,
          createdAt: fields.created_at,
        }
      })
  } catch (error) {
    console.error("Failed to get user tasks:", error)
    return []
  }
}

/**
 * Get user's IOTA balance
 * @param address - User's wallet address
 * @returns Balance in IOTA
 */
export async function getBalance(address: string): Promise<string> {
  try {
    const balance = await iotaClient.getBalance({
      owner: address,
      coinType: "0x2::iota::IOTA",
    })
    // Convert from NANOS to IOTA (divide by 1,000,000,000)
    return (Number(balance.totalBalance) / 1_000_000_000).toFixed(4)
  } catch (error) {
    console.error("Failed to get balance:", error)
    return "0"
  }
}

/**
 * Format transaction digest for display
 */
export function formatTxHash(digest: string): string {
  return `${digest.slice(0, 6)}...${digest.slice(-4)}`
}

/**
 * Get explorer URL for transaction
 */
export function getExplorerUrl(digest: string): string {
  return `${IOTA_EXPLORER_URL}/txblock/${digest}?network=testnet`
}

/**
 * Format transaction details for display in confirmation modal
 */
export function formatTransactionDetails(type: "stake" | "complete" | "forfeit", taskName: string) {
  const details: { label: string; value: string }[] = []

  if (type === "stake") {
    details.push(
      { label: "Action", value: "Stake Task" },
      { label: "Task", value: taskName },
      { label: "Function", value: "study_stake::stake_task" },
      { label: "Package", value: formatTxHash(PACKAGE_ID) }
    )
  } else if (type === "complete") {
    details.push(
      { label: "Action", value: "Complete Task" },
      { label: "Task", value: taskName },
      { label: "Function", value: "study_stake::complete_task" },
      { label: "Package", value: formatTxHash(PACKAGE_ID) }
    )
  } else if (type === "forfeit") {
    details.push(
      { label: "Action", value: "Forfeit Task" },
      { label: "Task", value: taskName },
      { label: "Function", value: "study_stake::forfeit_task" },
      { label: "Package", value: formatTxHash(PACKAGE_ID) }
    )
  }

  return details
}
