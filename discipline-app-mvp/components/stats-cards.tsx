import { Clock, Zap, CheckCircle2 } from "lucide-react"

interface StatsCardsProps {
  stats: {
    freeSessionsLeft: number
    streakCount: number
    disciplineScore: number
    totalCompleted: number
  }
}

export function StatsCards({ stats }: StatsCardsProps) {
  return (
    <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Free Sessions */}
      <div className="border-4 border-foreground bg-card p-6 brutal-shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Clock className="h-6 w-6 text-accent" />
          <span className="font-mono text-sm font-bold uppercase text-muted-foreground">Free Sessions</span>
        </div>
        <div className="font-mono text-4xl font-black">{stats.freeSessionsLeft}</div>
        <p className="mt-1 font-mono text-xs font-bold">Left today</p>
      </div>

      {/* Discipline Score */}
      <div className="border-4 border-foreground bg-primary p-6 text-primary-foreground brutal-shadow-sm">
        <div className="mb-2 flex items-center gap-2">
          <Zap className="h-6 w-6" />
          <span className="font-mono text-sm font-bold uppercase opacity-90">Discipline Score</span>
        </div>
        <div className="font-mono text-4xl font-black">{stats.disciplineScore}</div>
        <p className="mt-1 font-mono text-xs font-bold opacity-90">Total points earned</p>
      </div>

      {/* Completed Tasks */}
      <div className="border-4 border-foreground bg-accent p-6 text-accent-foreground brutal-shadow-sm sm:col-span-2 lg:col-span-1">
        <div className="mb-2 flex items-center gap-2">
          <CheckCircle2 className="h-6 w-6" />
          <span className="font-mono text-sm font-bold uppercase opacity-90">Completed</span>
        </div>
        <div className="font-mono text-4xl font-black">{stats.totalCompleted}</div>
        <p className="mt-1 font-mono text-xs font-bold opacity-90">Tasks finished</p>
      </div>
    </div>
  )
}
