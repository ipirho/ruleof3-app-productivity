import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Alert,
} from "react-native";
import { PanGestureHandler, PanGestureHandlerGestureEvent, State } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";
import { Edit3, Plus, Check, X, Flame, Calendar } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useTasks } from "@/providers/TaskProvider";
import { COLORS } from "@/constants/colors";
import { Task } from "@/types/task";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

export default function HomeScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { 
    tasks, 
    streak, 
    hasSetTasksToday,
    setDailyTasks, 
    toggleTaskComplete,
    reorderTasks,
    lastCompletedDate 
  } = useTasks();
  
  const [isEditMode, setIsEditMode] = useState(false);
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [newTasks, setNewTasks] = useState<string[]>(["", "", ""]);
  const [dragState, setDragState] = useState({
    isDragging: false,
    draggedTaskId: null as string | null,
    draggedTaskIndex: -1,
    currentY: 0,
    initialY: 0,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef([
    new Animated.Value(0.9),
    new Animated.Value(0.9),
    new Animated.Value(0.9),
  ]).current;

  useEffect(() => {
    if (!hasSetTasksToday && tasks.length === 0) {
      setShowSetupModal(true);
    }
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    scaleAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const getCurrentDateFormatted = () => {
    const today = new Date();
    return today.toLocaleDateString('en-US', { 
      weekday: 'long', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleSetTasks = () => {
    const validTasks = newTasks.filter(t => t.trim());
    if (validTasks.length !== 3) {
      Alert.alert("3 Tasks Required", "Please enter exactly 3 tasks for today");
      return;
    }
    
    setDailyTasks(newTasks.map(title => title.trim()));
    setShowSetupModal(false);
    setNewTasks(["", "", ""]);
    if (Platform.OS !== 'web') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const handleTaskPress = (task: Task) => {
    if (!isEditMode) {
      router.push({
        pathname: "/task-detail",
        params: { taskId: task.id }
      });
    }
  };

  const handleToggleComplete = async (taskId: string) => {
    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleTaskComplete(taskId);
  };

  const getTaskColor = (index: number, completed: boolean = false) => {
    if (completed) return COLORS.taskCompleted;
    switch (index) {
      case 0: return COLORS.taskGreen;
      case 1: return COLORS.taskYellow;
      case 2: return COLORS.taskRed;
      default: return COLORS.taskGreen;
    }
  };

  const getTaskLabel = (index: number) => {
    switch (index) {
      case 0: return "DOING NOW";
      case 1: return "UP NEXT";
      case 2: return "LATER";
      default: return "";
    }
  };

  const allTasksComplete = tasks.length === 3 && tasks.every(t => t.completed);
  
  // Separate completed and incomplete tasks
  const incompleteTasks = tasks.filter(t => !t.completed);
  const completedTasks = tasks.filter(t => t.completed);

  const handleDragStart = (taskId: string, index: number) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setDragState({
      isDragging: true,
      draggedTaskId: taskId,
      draggedTaskIndex: index,
      currentY: 0,
      initialY: 0,
    });
  };

  const handleDragMove = (y: number) => {
    setDragState(prev => ({
      ...prev,
      currentY: y,
    }));
  };

  const handleDragEnd = () => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    // Calculate the drop index and perform reordering if necessary
    if (dragState.isDragging && dragState.draggedTaskIndex !== -1) {
      const dropIndex = getDropIndex(dragState.currentY);
      
      if (dropIndex !== dragState.draggedTaskIndex) {
        reorderTasks(dragState.draggedTaskIndex, dropIndex);
      }
    }
    
    setDragState({
      isDragging: false,
      draggedTaskId: null,
      draggedTaskIndex: -1,
      currentY: 0,
      initialY: 0,
    });
  };

  const getDropIndex = (currentY: number) => {
    try {
      const taskHeight = 140; // Approximate height of each task card including margins
      const baseY = 200; // Starting Y position of first task (account for header)
      
      // Safety checks
      if (!Number.isFinite(currentY) || incompleteTasks.length === 0) {
        return 0;
      }
      
      if (currentY < baseY) return 0;
      
      for (let i = 0; i < incompleteTasks.length; i++) {
        const taskY = baseY + (i * taskHeight);
        if (currentY < taskY + (taskHeight / 2)) {
          return Math.max(0, Math.min(i, incompleteTasks.length - 1));
        }
      }
      
      return Math.max(0, incompleteTasks.length - 1);
    } catch (error) {
      console.error("Error calculating drop index:", error);
      return 0; // Default to first position on error
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <View style={styles.headerTop}>
            <Text style={styles.title}>Rule of 3</Text>
            {tasks.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setIsEditMode(!isEditMode);
                  if (Platform.OS !== 'web') {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                }}
                style={styles.editButton}
              >
                <Edit3 size={20} color={isEditMode ? COLORS.primary : COLORS.text} />
              </TouchableOpacity>
            )}
          </View>
          
          <View style={styles.streakContainer}>
            <View style={styles.streakBadge}>
              <Flame size={20} color={COLORS.flame} />
              <Text style={styles.streakText}>{streak}</Text>
              <Text style={styles.streakLabel}>day streak</Text>
            </View>
            {allTasksComplete && (
              <View style={styles.completeBadge}>
                <Check size={16} color="white" />
                <Text style={styles.completeText}>All Done!</Text>
              </View>
            )}
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          scrollEnabled={!dragState.isDragging}
        >
          {/* Current Date Display */}
          {tasks.length > 0 && (
            <View style={styles.dateContainer}>
              <Text style={styles.currentDate}>{getCurrentDateFormatted()}</Text>
            </View>
          )}
          
          {tasks.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color={COLORS.textSecondary} />
              <Text style={styles.emptyTitle}>No tasks for today</Text>
              <Text style={styles.emptySubtitle}>Set your 3 daily priorities</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowSetupModal(true)}
              >
                <Plus size={20} color="white" />
                <Text style={styles.addButtonText}>Set Today's Tasks</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.tasksContainer}>
              {isEditMode && (
                <Text style={styles.editHint}>Long press and drag to reorder tasks</Text>
              )}
              
              {incompleteTasks.map((task, index) => (
                <DraggableTaskCard
                  key={task.id}
                  task={task}
                  index={index}
                  color={getTaskColor(index, false)}
                  label={getTaskLabel(index)}
                  isEditMode={isEditMode}
                  onPress={() => handleTaskPress(task)}
                  onToggleComplete={() => handleToggleComplete(task.id)}
                  onDragStart={() => handleDragStart(task.id, index)}
                  onDragMove={handleDragMove}
                  onDragEnd={handleDragEnd}
                  isDragging={dragState.draggedTaskId === task.id}
                  scaleAnim={scaleAnims[index] || new Animated.Value(1)}
                />
              ))}
              
              {completedTasks.length > 0 && (
                <View>
                  <View style={styles.separator}>
                    <View style={styles.separatorLine} />
                    <Text style={styles.separatorText}>Completed</Text>
                    <View style={styles.separatorLine} />
                  </View>
                  
                  {completedTasks.map((task, index) => {
                    const originalIndex = tasks.findIndex(t => t.id === task.id);
                    return (
                      <TaskCard
                        key={task.id}
                        task={task}
                        index={originalIndex}
                        color={getTaskColor(0, true)}
                        label="COMPLETED"
                        isEditMode={false}
                        onPress={() => handleTaskPress(task)}
                        onToggleComplete={() => handleToggleComplete(task.id)}
                        scaleAnim={scaleAnims[originalIndex] || new Animated.Value(1)}
                      />
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>

        <Modal
          visible={showSetupModal}
          animationType="slide"
          transparent={true}
        >
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView 
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.modalKeyboardView}
            >
              <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Today's 3 Tasks</Text>
                <TouchableOpacity
                  onPress={() => setShowSetupModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>
              
              <Text style={styles.modalSubtitle}>
                What are the 3 most important things you need to accomplish today?
              </Text>

              {newTasks.map((task, index) => (
                <View key={index} style={styles.inputContainer}>
                  <View 
                    style={[
                      styles.inputNumber, 
                      { backgroundColor: getTaskColor(index) }
                    ]}
                  >
                    <Text style={styles.inputNumberText}>{index + 1}</Text>
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder={`Task ${index + 1}`}
                    placeholderTextColor={COLORS.textSecondary}
                    value={task}
                    onChangeText={(text) => {
                      const updated = [...newTasks];
                      updated[index] = text;
                      setNewTasks(updated);
                    }}
                    maxLength={100}
                  />
                </View>
              ))}

              <TouchableOpacity
                style={[
                  styles.setTasksButton,
                  newTasks.filter(t => t.trim()).length !== 3 && styles.disabledButton
                ]}
                onPress={handleSetTasks}
                disabled={newTasks.filter(t => t.trim()).length !== 3}
              >
                <Text style={styles.setTasksButtonText}>Set Tasks</Text>
              </TouchableOpacity>
              </View>
            </KeyboardAvoidingView>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

interface DraggableTaskCardProps {
  task: Task;
  index: number;
  color: string;
  label: string;
  isEditMode: boolean;
  onPress: () => void;
  onToggleComplete: () => void;
  onDragStart: () => void;
  onDragMove: (y: number) => void;
  onDragEnd: () => void;
  isDragging: boolean;
  scaleAnim: Animated.Value;
}

function DraggableTaskCard({ 
  task, 
  index, 
  color, 
  label, 
  isEditMode, 
  onPress, 
  onToggleComplete,
  onDragStart,
  onDragMove,
  onDragEnd,
  isDragging,
  scaleAnim
}: DraggableTaskCardProps) {
  const [dragOffset, setDragOffset] = useState(0);
  const panRef = useRef<PanGestureHandler>(null);

  const onGestureEvent = (event: PanGestureHandlerGestureEvent) => {
    // Use React state instead of Animated.Value to avoid conflicts
    setDragOffset(event.nativeEvent.translationY);
    onDragMove(event.nativeEvent.absoluteY);
  };

  const onHandlerStateChange = (event: any) => {
    const { state } = event.nativeEvent;
    
    if (state === State.BEGAN) {
      onDragStart();
      if (Platform.OS !== 'web') {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } else if (state === State.END || state === State.CANCELLED) {
      // Reset position
      setDragOffset(0);
      onDragEnd();
    }
  };

  return (
    <PanGestureHandler
      ref={panRef}
      enabled={isEditMode && !task.completed}
      activeOffsetY={[-15, 15]}
      shouldCancelWhenOutside={false}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          styles.taskCard,
          { backgroundColor: color },
          {
            transform: [
              { scale: scaleAnim },
              { translateY: isDragging ? dragOffset : 0 }
            ],
            opacity: isDragging ? 0.8 : 1,
            zIndex: isDragging ? 1000 : 1,
            elevation: isDragging ? 15 : 8,
          },
        ]}
      >
        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.7}
          disabled={isEditMode}
          style={styles.taskCardTouchable}
        >
          <View style={styles.taskCardContent}>
            <View style={styles.taskLeft}>
              <View style={[styles.priorityIndicator, { backgroundColor: "rgba(0,0,0,0.2)" }]}>
                <Text style={styles.priorityLabel}>{label}</Text>
              </View>
              <Text style={[
                styles.taskTitle,
                task.completed && styles.taskTitleCompleted
              ]}>
                {task.title}
              </Text>
              {task.notes && (
                <Text style={styles.taskNotes} numberOfLines={1}>
                  {task.notes}
                </Text>
              )}
              {task.subBullets.length > 0 && (
                <Text style={styles.subBulletCount}>
                  {task.subBullets.filter(b => b.completed).length}/{task.subBullets.length} sub-tasks
                </Text>
              )}
            </View>
            
            <TouchableOpacity
              onPress={onToggleComplete}
              style={[
                styles.checkbox,
                task.completed && styles.checkboxCompleted
              ]}
            >
              {task.completed && <Check size={16} color="white" />}
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}

interface TaskCardProps {
  task: Task;
  index: number;
  color: string;
  label: string;
  isEditMode: boolean;
  onPress: () => void;
  onToggleComplete: () => void;
  scaleAnim: Animated.Value;
}

function TaskCard({ 
  task, 
  index, 
  color, 
  label, 
  isEditMode, 
  onPress, 
  onToggleComplete,
  scaleAnim 
}: TaskCardProps) {
  return (
    <Animated.View
      style={[
        styles.taskCard,
        { backgroundColor: color },
        {
          transform: [{ scale: scaleAnim }],
        },
      ]}
    >
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={styles.taskCardTouchable}
      >
        <View style={styles.taskCardContent}>
          <View style={styles.taskLeft}>
            <View style={[styles.priorityIndicator, { backgroundColor: "rgba(0,0,0,0.2)" }]}>
              <Text style={styles.priorityLabel}>{label}</Text>
            </View>
            <Text style={[
              styles.taskTitle,
              task.completed && styles.taskTitleCompleted
            ]}>
              {task.title}
            </Text>
            {task.notes && (
              <Text style={styles.taskNotes} numberOfLines={1}>
                {task.notes}
              </Text>
            )}
            {task.subBullets.length > 0 && (
              <Text style={styles.subBulletCount}>
                {task.subBullets.filter(b => b.completed).length}/{task.subBullets.length} sub-tasks
              </Text>
            )}
          </View>
          
          <TouchableOpacity
            onPress={onToggleComplete}
            style={[
              styles.checkbox,
              task.completed && styles.checkboxCompleted
            ]}
          >
            {task.completed && <Check size={16} color="white" />}
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
  },
  editButton: {
    padding: 8,
  },
  streakContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  streakText: {
    fontSize: 18,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
  },
  streakLabel: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
  },
  completeBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.taskGreen,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  completeText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "white",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  dateContainer: {
    alignItems: "center",
    marginBottom: 16,
    paddingVertical: 12,
  },
  currentDate: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 80,
  },
  emptyTitle: {
    fontSize: 24,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
    marginTop: 20,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
    marginTop: 30,
    gap: 8,
  },
  addButtonText: {
    color: "white",
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
  },
  tasksContainer: {
    paddingTop: 20,
    gap: 16,
  },
  editHint: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 8,
  },
  taskCard: {
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    marginBottom: 16,
  },
  taskCardTouchable: {
    flex: 1,
  },
  taskCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 24,
  },
  taskLeft: {
    flex: 1,
    marginRight: 12,
  },
  priorityIndicator: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginBottom: 8,
  },
  priorityLabel: {
    fontSize: 10,
    fontFamily: "Poppins_700Bold",
    color: "white",
    letterSpacing: 1,
  },
  taskTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  taskNotes: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.text,
    marginTop: 4,
  },
  subBulletCount: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.text,
    marginTop: 6,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: COLORS.taskGreen,
    borderColor: COLORS.taskGreen,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalKeyboardView: {
    flex: 1,
    justifyContent: "center",
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    padding: 32,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 28,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
    marginBottom: 32,
    lineHeight: 24,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  inputNumber: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  inputNumberText: {
    color: "white",
    fontFamily: "Poppins_700Bold",
    fontSize: 16,
  },
  input: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    fontFamily: "Poppins_500Medium",
    color: COLORS.text,
  },
  setTasksButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
    marginTop: 24,
  },
  disabledButton: {
    opacity: 0.5,
  },
  setTasksButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
  },
  separator: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: COLORS.separator,
  },
  separatorText: {
    fontSize: 12,
    fontFamily: "Poppins_500Medium",
    color: COLORS.textSecondary,
    marginHorizontal: 16,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  dropZone: {
    height: 4,
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    marginHorizontal: 20,
    marginVertical: 8,
  },
});
