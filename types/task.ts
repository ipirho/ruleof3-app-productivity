export interface SubBullet {
  id: string;
  text: string;
  completed: boolean;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  notes: string;
  subBullets: SubBullet[];
  createdAt: string;
}

export interface AppState {
  tasks: Task[];
  streak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  lastCompletedDate: string | null;
  lastActiveDate: string;
  hasSetTasksToday: boolean;
  // New fields for historical data
  taskHistory?: { [dateString: string]: Task[] };
  firstUseDate?: string;
}

// New interface for the enhanced app state with historical data
export interface HistoricalAppState {
  // Current day tasks (for backward compatibility)
  tasks: Task[];
  streak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  lastCompletedDate: string | null;
  lastActiveDate: string;
  hasSetTasksToday: boolean;
  // Historical task storage by date
  taskHistory: { [dateString: string]: Task[] };
  firstUseDate: string;
}
