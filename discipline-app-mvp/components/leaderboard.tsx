'use client';

import { useEffect, useState } from 'react';
import { Trophy, Medal, Award, RefreshCw } from 'lucide-react';

interface LeaderboardEntry {
  address: string;
  totalPoints: number;
  tasksCompleted: number;
  totalStaked: number;
}

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  cached: boolean;
  timestamp: number;
  totalUsers?: number;
  error?: string;
}

export function Leaderboard() {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentRank, setCurrentRank] = useState<number | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Replace this with the actual connected user's address
  const userAddress: string | undefined = undefined; // Will come from wallet connection

  const fetchLeaderboard = async (showRefreshLoading = false) => {
    try {
      if (showRefreshLoading) setRefreshing(true);

      const response = await fetch('/api/leaderboard');
      const result: LeaderboardResponse = await response.json();

      if (response.ok) {
        setData(result.leaderboard);
        setLastUpdate(new Date(result.timestamp));
        setError(null);

        // Find current user's rank
        if (userAddress) {
          const userRank = result.leaderboard.findIndex(
            (entry) => entry.address.toLowerCase() === (userAddress as string).toLowerCase()
          );
          setCurrentRank(userRank >= 0 ? userRank + 1 : null);
        }
      } else {
        setError(result.error || 'Failed to fetch leaderboard');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError('Failed to connect to leaderboard');
    } finally {
      setLoading(false);
      if (showRefreshLoading) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();

    // Poll every 30 seconds for updates
    const interval = setInterval(() => {
      fetchLeaderboard();
    }, 30000);

    return () => clearInterval(interval);
  }, [userAddress]);

  const formatAddress = (address: string) => {
    if (!address) return 'Unknown';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatPoints = (points: number) => {
    return new Intl.NumberFormat('en-US').format(points);
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-6 w-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-6 w-6 text-gray-400" />;
    if (rank === 3) return <Award className="h-6 w-6 text-amber-700" />;
    return <span className="font-mono text-lg font-bold">#{rank}</span>;
  };

  const getRankClass = (rank: number) => {
    if (rank === 1) return 'bg-yellow-50 border-yellow-500';
    if (rank === 2) return 'bg-gray-50 border-gray-500';
    if (rank === 3) return 'bg-amber-50 border-amber-700';
    return 'bg-card border-foreground';
  };

  if (loading) {
    return (
      <div className="border-4 border-foreground bg-card p-8 brutal-shadow-sm">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="font-mono text-2xl font-black uppercase">Leaderboard</h2>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-foreground border-t-transparent" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border-4 border-red-500 bg-red-50 p-8 brutal-shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <span className="font-mono text-xl font-black uppercase text-red-700">Error</span>
        </div>
        <p className="font-mono text-sm text-red-600">{error}</p>
        <button
          onClick={() => fetchLeaderboard(true)}
          className="mt-4 border-2 border-red-700 bg-red-700 px-4 py-2 font-mono font-bold text-white hover:bg-red-800"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="border-4 border-foreground bg-card brutal-shadow-sm">
      <div className="border-b-4 border-foreground p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-mono text-2xl font-black uppercase">Leaderboard</h2>
            <p className="mt-1 font-mono text-sm font-bold text-muted-foreground">
              Top Performers by Points
            </p>
          </div>
          <button
            onClick={() => fetchLeaderboard(true)}
            disabled={refreshing}
            className="flex items-center gap-2 border-2 border-foreground bg-primary px-4 py-2 font-mono font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
        {lastUpdate && (
          <p className="mt-2 font-mono text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </p>
        )}
      </div>

      {/* Current User's Rank (if in leaderboard) */}
      {currentRank && currentRank > 10 && (
        <div className="border-b-4 border-foreground bg-accent p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="font-mono text-lg font-bold">#{currentRank}</span>
              <div>
                <p className="font-mono text-sm font-bold">Your Rank</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatAddress(userAddress || '0x0')}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-mono text-lg font-black">
                {formatPoints(data[currentRank - 1]?.totalPoints || 0)} pts
              </p>
              <p className="font-mono text-xs text-muted-foreground">
                {data[currentRank - 1]?.tasksCompleted || 0} tasks
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Top 10 Leaderboard */}
      <div className="divide-y-4 divide-foreground">
        {data.length === 0 ? (
          <div className="p-12 text-center">
            <p className="font-mono text-lg font-bold text-muted-foreground">
              No entries yet. Be the first to complete a task!
            </p>
          </div>
        ) : (
          data.slice(0, 10).map((entry, index) => (
            <div
              key={entry.address}
              className={`flex items-center justify-between p-4 transition-colors hover:bg-muted/50 ${getRankClass(index + 1)}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center">
                  {getRankIcon(index + 1)}
                </div>
                <div>
                  <p className="font-mono text-base font-bold">
                    {formatAddress(entry.address)}
                  </p>
                  <p className="font-mono text-xs text-muted-foreground">
                    {entry.tasksCompleted} task{entry.tasksCompleted !== 1 ? 's' : ''} completed
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-mono text-xl font-black">
                  {formatPoints(entry.totalPoints)} pts
                </p>
                <p className="font-mono text-xs text-muted-foreground">
                  {formatPoints(entry.totalStaked)} IOTA staked
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Total Stats */}
      {data.length > 0 && (
        <div className="border-t-4 border-foreground bg-muted p-4">
          <div className="flex items-center justify-between">
            <p className="font-mono text-sm font-bold text-muted-foreground">
              Total Participants
            </p>
            <p className="font-mono text-lg font-black">{data.length}</p>
          </div>
        </div>
      )}
    </div>
  );
}
