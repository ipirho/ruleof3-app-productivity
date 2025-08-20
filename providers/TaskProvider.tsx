import React, { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { Task, SubBullet, AppState } from "@/types/task";

const STORAGE_KEY = "ruleof3_app_state";

export const [TaskProvider, useTasks] = createContextHook(() => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
  const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null);
  const [hasSetTasksToday, setHasSetTasksToday] = useState(false);

  // Load state from storage
  useEffect(() => {
    loadAppState();
  }, []);

  // Save state to storage whenever it changes
  useEffect(() => {
    saveAppState();
  }, [tasks, streak, longestStreak, totalTasksCompleted, lastCompletedDate, hasSetTasksToday]);

  const loadAppState = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const state: AppState = JSON.parse(stored);
        const today = new Date().toDateString();
        
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
      }
    } catch (error) {
      console.error("Error loading app state:", error);
    }
  };

  const saveAppState = async () => {
    try {
      const state: AppState = {
        tasks,
        streak,
        longestStreak,
        totalTasksCompleted,
        lastCompletedDate,
        lastActiveDate: new Date().toDateString(),
        hasSetTasksToday,
      };
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch (error) {
      console.error("Error saving app state:", error);
    }
  };

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
      const newTasks = [...prevTasks];
      const [movedTask] = newTasks.splice(fromIndex, 1);
      newTasks.splice(toIndex, 0, movedTask);
      return newTasks;
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
  };
});