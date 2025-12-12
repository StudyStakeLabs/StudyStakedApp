import { CheckCircle2, XCircle } from "lucide-react"

export function TaskHistory() {
  // Mock data - in real app, fetch from backend
  const recentTasks = [
    { id: 1, name: "Study React Hooks", category: "Study", duration: 45, completed: true, mode: "free" },
    { id: 2, name: "Write Blog Post", category: "Work", duration: 60, completed: true, mode: "stake" },
    { id: 3, name: "Morning Workout", category: "Health", duration: 30, completed: true, mode: "free" },
    { id: 4, name: "Client Project", category: "Work", duration: 120, completed: false, mode: "stake" },
  ]

  return (
    <div className="border-4 border-foreground bg-card p-6 brutal-shadow-sm">
      <h3 className="mb-4 font-mono text-xl font-black uppercase">Recent Tasks</h3>

      <div className="space-y-3">
        {recentTasks.map((task) => (
          <div key={task.id} className="flex items-center justify-between border-2 border-foreground bg-muted p-4">
            <div className="flex items-center gap-3">
              {task.completed ? (
                <CheckCircle2 className="h-5 w-5 text-accent" />
              ) : (
                <XCircle className="h-5 w-5 text-destructive" />
              )}
              <div>
                <p className="font-mono font-bold">{task.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {task.category} • {task.duration} min
                </p>
              </div>
            </div>

            <div className="text-right">
              <span
                className={`inline-block border-2 border-foreground px-2 py-1 font-mono text-xs font-black uppercase ${
                  task.mode === "stake"
                    ? "bg-destructive text-destructive-foreground"
                    : "bg-accent text-accent-foreground"
                }`}
              >
                {task.mode}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
