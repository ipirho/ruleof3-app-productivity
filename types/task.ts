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
}