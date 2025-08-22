import React, { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { Task, SubBullet, AppState, HistoricalAppState } from "@/types/task";

const STORAGE_KEY = "ruleof3_app_state";

export const [TaskProvider, useTasks] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null);
  const [hasSetTasksToday, setHasSetTasksToday] = useState(false);
  // New state for historical data
  const [taskHistory, setTaskHistory] = useState<{ [dateString: string]: Task[] }>({});
  const [firstUseDate, setFirstUseDate] = useState<string>("");

  // Load state from storage
  useEffect(() => {
    loadAppState();
  }, []);

  // Save state to storage whenever it changes
  useEffect(() => {
    saveAppState();
  }, [tasks, streak, longestStreak, totalTasksCompleted, lastCompletedDate, hasSetTasksToday, taskHistory, firstUseDate]);

  const loadAppState = async () => {
    try {
      // TODO: Backend - Replace with API call to fetch user's historical data and first usage date
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: AppState = JSON.parse(stored);
        const today = new Date().toDateString();
        
        // Data migration: Handle old format and set up historical storage
        const history = state.taskHistory || {};
        const firstUse = state.firstUseDate || state.lastActiveDate || today;
        
        // Store previous day's tasks in history if they exist and we're switching to a new day
        if (state.lastActiveDate !== today && state.tasks.length > 0) {
          history[state.lastActiveDate] = state.tasks;
        }
        
        setTaskHistory(history);
        setFirstUseDate(firstUse);
        
        // Check if it's a new day
        if (state.lastActiveDate !== today) {
          // Reset daily tasks if it's a new day
          setTasks([]);
          setHasSetTasksToday(false);
          
          // Check if streak should continue or reset
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          
          if (state.lastCompletedDate === yesterday.toDateString() && 
              state.tasks.every(t => t.completed)) {
            // Continue streak
            setStreak(state.streak);
          } else if (state.lastActiveDate === yesterday.toDateString() &&
                     !state.tasks.every(t => t.completed)) {
            // Streak broken - reset
            setStreak(0);
          } else {
            // Keep existing streak if within valid range
            setStreak(state.streak);
          }
        } else {
          // Same day - restore everything
          setTasks(state.tasks);
          setStreak(state.streak);
          setHasSetTasksToday(state.hasSetTasksToday || false);
        }
        
        setLongestStreak(state.longestStreak);
        setTotalTasksCompleted(state.totalTasksCompleted);
        setLastCompletedDate(state.lastCompletedDate);
      } else {
        // First time user - set initial first use date
        const today = new Date().toDateString();
        setFirstUseDate(today);
      }
    } catch (error) {
      console.error("Error loading app state:", error);
    }
  };

  const saveAppState = async () => {
    try {
      // TODO: Backend - Replace with API call to sync data to server
      const today = new Date().toDateString();
      
      // Store current day's tasks in history before saving
      const updatedHistory = { ...taskHistory };
      if (tasks.length > 0) {
        updatedHistory[today] = tasks;
      }
      
      const state: AppState = {
        tasks,
        streak,
        longestStreak,
        totalTasksCompleted,
        lastCompletedDate,
        lastActiveDate: today,
        hasSetTasksToday,
        taskHistory: updatedHistory,
        firstUseDate: firstUseDate || today,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving app state:", error);
    }
  };

  // Utility function to get tasks for a specific date
  const getTasksForDate = useCallback((dateString: string): Task[] => {
    // TODO: Backend - Replace with API call to fetch tasks for specific date
    const today = new Date().toDateString();
    if (dateString === today) {
      return tasks;
    }
    return taskHistory[dateString] || [];
  }, [tasks, taskHistory]);

  // Utility function to get the earliest date with tasks
  const getFirstTaskDate = useCallback((): string => {
    // TODO: Backend - Replace with API call to get user's first task date
    return firstUseDate || new Date().toDateString();
  }, [firstUseDate]);

  // Utility function to check if a date has completed tasks
  const hasCompletedTasksOnDate = useCallback((dateString: string): boolean => {
    const tasksForDate = getTasksForDate(dateString);
    return tasksForDate.length === 3 && tasksForDate.every(t => t.completed);
  }, [getTasksForDate]);

  // Utility function to check if a date has any tasks
  const hasTasksOnDate = useCallback((dateString: string): boolean => {
    const tasksForDate = getTasksForDate(dateString);
    return tasksForDate.length > 0;
  }, [getTasksForDate]);

  const setDailyTasks = useCallback((taskTitles: string[]) => {
    const newTasks: Task[] = taskTitles.map((title, index) => ({
      id: `task-${Date.now()}-${index}`,
      title,
      completed: false,
      notes: "",
      subBullets: [],
      createdAt: new Date().toISOString(),
    }));
    
    setTasks(newTasks);
    setHasSetTasksToday(true);
  }, []);

  const toggleTaskComplete = useCallback((taskId: string) => {
    setTasks(prevTasks => {
      const updatedTasks = prevTasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      
      // Check if all tasks are completed
      if (updatedTasks.every(t => t.completed) && updatedTasks.length === 3) {
        const today = new Date().toDateString();
        
        // Update streak
        if (lastCompletedDate !== today) {
          setStreak(prev => {
            const newStreak = prev + 1;
            setLongestStreak(current => Math.max(current, newStreak));
            return newStreak;
          });
          setLastCompletedDate(today);
        }
        
        // Update total completed
        const completedCount = updatedTasks.filter(t => t.completed).length;
        const previousCompletedCount = prevTasks.filter(t => t.completed).length;
        if (completedCount > previousCompletedCount) {
          setTotalTasksCompleted(prev => prev + (completedCount - previousCompletedCount));
        }
      }
      
      return updatedTasks;
    });
  }, [lastCompletedDate]);

  const updateTaskDetails = useCallback((taskId: string, notes: string, subBullets: SubBullet[]) => {
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId ? { ...task, notes, subBullets } : task
      )
    );
  }, []);

  const reorderTasks = useCallback((fromIndex: number, toIndex: number) => {
    setTasks(prevTasks => {
      try {
        // Validate indices
        if (fromIndex < 0 || toIndex < 0 || 
            fromIndex >= prevTasks.length || toIndex >= prevTasks.length ||
            fromIndex === toIndex) {
          console.warn("Invalid reorder indices:", { fromIndex, toIndex, tasksLength: prevTasks.length });
          return prevTasks; // Return unchanged if invalid
        }

        // Only allow reordering of incomplete tasks
        const incompleteTasks = prevTasks.filter(t => !t.completed);
        const completedTasks = prevTasks.filter(t => t.completed);
        
        if (fromIndex >= incompleteTasks.length || toIndex >= incompleteTasks.length) {
          console.warn("Index out of bounds for incomplete tasks");
          return prevTasks;
        }

        // Reorder only the incomplete tasks
        const newIncompleteTasks = [...incompleteTasks];
        const [movedTask] = newIncompleteTasks.splice(fromIndex, 1);
        newIncompleteTasks.splice(toIndex, 0, movedTask);
        
        // Combine back together: incomplete tasks first, then completed
        return [...newIncompleteTasks, ...completedTasks];
        
      } catch (error) {
        console.error("Error in reorderTasks:", error);
        return prevTasks; // Return unchanged on error
      }
    });
  }, []);

  return {
    tasks,
    streak,
    longestStreak,
    totalTasksCompleted,
    lastCompletedDate,
    hasSetTasksToday,
    setDailyTasks,
    toggleTaskComplete,
    updateTaskDetails,
    reorderTasks,
    // New calendar-related functions
    getTasksForDate,
    getFirstTaskDate,
    hasCompletedTasksOnDate,
    hasTasksOnDate,
    taskHistory,
    firstUseDate,
  };
});
