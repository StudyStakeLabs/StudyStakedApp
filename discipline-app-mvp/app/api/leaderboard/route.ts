import { NextResponse } from 'next/server';
import { IotaClient } from '@iota/iota-sdk/client';
import type { EventId } from '@iota/iota-sdk/client';

// Cache configuration
const CACHE_DURATION = 60000; // 1 minute
let cachedLeaderboard: LeaderboardEntry[] | null = null;
let lastFetch = 0;

interface LeaderboardEntry {
  address: string;
  totalPoints: number;
  tasksCompleted: number;
  totalStaked: number;
}

// Task event structure from Move contract
interface TaskEvent {
  staker: string;
  amount: string;
  task_id: string;
  timestamp?: number;
}

// Use the IOTA testnet RPC URL
const IOTA_RPC_URL = process.env.NEXT_PUBLIC_IOTA_RPC_URL || 'https://api.testnet.iota.cafe';
const PACKAGE_ID = process.env.NEXT_PUBLIC_CONTRACT_PACKAGE_ID || '';

// Initialize IOTA client
const iotaClient = new IotaClient({ url: IOTA_RPC_URL });

// Fetch events using IotaClient
async function fetchEventsByType(eventType: 'TaskCompleted' | 'TaskForfeited', cursor: EventId | null = null) {
  try {
    const events = await iotaClient.queryEvents({
      query: { MoveEventType: `${PACKAGE_ID}::studystake::${eventType}` },
      limit: 100,
      cursor: cursor || undefined,
      order: 'descending',
    });

    return events;
  } catch (error) {
    console.error(`Error fetching ${eventType} events:`, error);
    return { data: [], hasNextPage: false, nextCursor: null };
  }
}

// Parse Move events and aggregate user points
async function aggregateUserPoints(): Promise<LeaderboardEntry[]> {
  const userMap = new Map<string, LeaderboardEntry>();

  // Fetch TaskCompleted events
  let completedCursor: EventId | null = null;
  let completedPageCount = 0;
  const MAX_PAGES = 10; // Limit to prevent excessive queries

  while (completedPageCount < MAX_PAGES) {
    const result = await fetchEventsByType('TaskCompleted', completedCursor);

    if (!result.data || result.data.length === 0) break;

    // Process each event
    for (const event of result.data) {
      // Parse the event content
      const parsedJson = event.parsedJson as TaskEvent;

      if (parsedJson && parsedJson.staker && parsedJson.amount) {
        const staker = parsedJson.staker;
        const amount = BigInt(parsedJson.amount); // Use BigInt for large numbers

        if (!userMap.has(staker)) {
          userMap.set(staker, {
            address: staker,
            totalPoints: 0,
            tasksCompleted: 0,
            totalStaked: 0,
          });
        }

        const user = userMap.get(staker)!;
        user.tasksCompleted += 1;
        user.totalStaked += Number(amount);
        // Award points: 1 point per nano IOTA staked and completed
        user.totalPoints += Number(amount);
      }
    }

    // Check if there are more pages
    if (!result.hasNextPage || !result.nextCursor) break;
    completedCursor = result.nextCursor;
    completedPageCount++;
  }

  // Fetch TaskForfeited events (for total staked tracking, no points)
  let forfeitedCursor: EventId | null = null;
  let forfeitedPageCount = 0;

  while (forfeitedPageCount < MAX_PAGES) {
    const result = await fetchEventsByType('TaskForfeited', forfeitedCursor);

    if (!result.data || result.data.length === 0) break;

    // Process each event
    for (const event of result.data) {
      const parsedJson = event.parsedJson as TaskEvent;

      if (parsedJson && parsedJson.staker && parsedJson.amount) {
        const staker = parsedJson.staker;
        const amount = BigInt(parsedJson.amount);

        if (!userMap.has(staker)) {
          userMap.set(staker, {
            address: staker,
            totalPoints: 0,
            tasksCompleted: 0,
            totalStaked: 0,
          });
        }

        const user = userMap.get(staker)!;
        user.totalStaked += Number(amount);
        // No points for forfeited tasks
      }
    }

    // Check if there are more pages
    if (!result.hasNextPage || !result.nextCursor) break;
    forfeitedCursor = result.nextCursor;
    forfeitedPageCount++;
  }

  // Convert to array and sort by total points descending
  return Array.from(userMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
}

export async function GET() {
  try {
    const now = Date.now();

    // Return cached data if still valid
    if (cachedLeaderboard && now - lastFetch < CACHE_DURATION) {
      return NextResponse.json({
        leaderboard: cachedLeaderboard,
        cached: true,
        timestamp: lastFetch,
      });
    }

    // Validate package ID
    if (!PACKAGE_ID) {
      return NextResponse.json(
        {
          error: 'Package ID not configured. Please set NEXT_PUBLIC_CONTRACT_PACKAGE_ID environment variable.',
          leaderboard: [],
        },
        { status: 500 }
      );
    }

    // Aggregate points from events
    const leaderboard = await aggregateUserPoints();

    // Update cache
    cachedLeaderboard = leaderboard;
    lastFetch = now;

    return NextResponse.json({
      leaderboard,
      cached: false,
      timestamp: now,
      totalUsers: leaderboard.length,
    });
  } catch (error) {
    console.error('Error in leaderboard API:', error);

    // Return cached data if available, even if expired
    if (cachedLeaderboard) {
      return NextResponse.json({
        leaderboard: cachedLeaderboard,
        cached: true,
        timestamp: lastFetch,
        error: 'Using cached data due to error',
      });
    }

    return NextResponse.json(
      {
        error: 'Failed to fetch leaderboard data',
        details: error instanceof Error ? error.message : 'Unknown error',
        leaderboard: [],
      },
      { status: 500 }
    );
  }
}
