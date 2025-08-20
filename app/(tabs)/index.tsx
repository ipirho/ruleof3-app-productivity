import React, { useState, useEffect, useRef, useMemo } from "react";
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
  PanResponder,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Edit3, Plus, Check, X, Flame, Calendar, Minus } from "lucide-react-native";
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
  
  // Reorder incomplete tasks to maintain priority order
  const orderedTasks = [...incompleteTasks, ...completedTasks];

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
        >
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
                <Text style={styles.editHint}>Drag tasks to reorder</Text>
              )}
              {incompleteTasks.map((task, index) => {
                return (
                  <DraggableTaskCard
                    key={task.id}
                    task={task}
                    index={index}
                    color={getTaskColor(index, false)}
                    label={getTaskLabel(index)}
                    isEditMode={isEditMode}
                    onPress={() => handleTaskPress(task)}
                    onToggleComplete={() => handleToggleComplete(task.id)}
                    onReorder={(fromIndex, toIndex) => {
                      // Convert incomplete task indices to full task array indices
                      const fromTaskIndex = tasks.findIndex(t => t.id === incompleteTasks[fromIndex].id);
                      const toTaskIndex = tasks.findIndex(t => t.id === incompleteTasks[toIndex].id);
                      reorderTasks(fromTaskIndex, toTaskIndex);
                    }}
                    scaleAnim={scaleAnims[index] || new Animated.Value(1)}
                    isCompleted={false}
                  />
                );
              })}
              
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
                      <DraggableTaskCard
                        key={task.id}
                        task={task}
                        index={originalIndex}
                        color={getTaskColor(0, true)}
                        label="COMPLETED"
                        isEditMode={false}
                        onPress={() => handleTaskPress(task)}
                        onToggleComplete={() => handleToggleComplete(task.id)}
                        onReorder={reorderTasks}
                        scaleAnim={scaleAnims[originalIndex] || new Animated.Value(1)}
                        isCompleted={true}
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
  onReorder: (fromIndex: number, toIndex: number) => void;
  scaleAnim: Animated.Value;
  isCompleted: boolean;
}

function DraggableTaskCard({ 
  task, 
  index, 
  color, 
  label, 
  isEditMode, 
  onPress, 
  onToggleComplete,
  onReorder,
  scaleAnim,
  isCompleted 
}: DraggableTaskCardProps) {
  const pan = useRef(new Animated.ValueXY()).current;
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);

  const panResponder = useMemo(() => 
    PanResponder.create({
      onStartShouldSetPanResponder: () => isEditMode && !isCompleted,
      onMoveShouldSetPanResponder: () => isEditMode && !isCompleted,
      onPanResponderGrant: (evt) => {
        setIsDragging(true);
        setDragStartY(evt.nativeEvent.pageY);
        if (Platform.OS !== 'web') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        
        // Calculate which position to drop based on vertical movement
        const cardHeight = 140; // Approximate height of each card including margin
        const moveDistance = gestureState.dy;
        const indexChange = Math.round(moveDistance / cardHeight);
        const newIndex = Math.min(2, Math.max(0, index + indexChange));
        
        if (newIndex !== index && Math.abs(moveDistance) > cardHeight / 3) {
          onReorder(index, newIndex);
          if (Platform.OS !== 'web') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
        }
        
        // Reset position
        Animated.spring(pan, {
          toValue: { x: 0, y: 0 },
          useNativeDriver: false,
        }).start();
      },
    }), [isEditMode, index, onReorder, isCompleted]);

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.taskCard,
        { backgroundColor: color },
        isCompleted && styles.taskCardCompleted,
        {
          transform: [
            { translateX: pan.x },
            { translateY: pan.y },
            { scale: scaleAnim }
          ],
          opacity: isDragging ? 0.9 : (isCompleted ? 0.6 : 1),
          zIndex: isDragging ? 1000 : 1,
          elevation: isDragging ? 10 : 2,
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
            {!isCompleted && (
              <View style={[styles.priorityIndicator, { backgroundColor: "rgba(0,0,0,0.2)" }]}>
                <Text style={styles.priorityLabel}>{label}</Text>
              </View>
            )}
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
  taskCardCompleted: {
    opacity: 0.6,
  },
});