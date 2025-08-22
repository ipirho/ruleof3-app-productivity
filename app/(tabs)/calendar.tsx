import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Platform,
} from "react-native";
import { Calendar } from "react-native-calendars";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Check, ChevronLeft, ChevronRight } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTasks } from "@/providers/TaskProvider";
import { COLORS } from "@/constants/colors";
import { Task } from "@/types/task";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

export default function CalendarScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { 
    getTasksForDate, 
    hasCompletedTasksOnDate, 
    hasTasksOnDate, 
    getFirstTaskDate 
  } = useTasks();

  const [selectedDate, setSelectedDate] = useState<string>("");
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date().toISOString().split('T')[0]);

  const onDayPress = useCallback((day: any) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedDate(day.dateString);
    setShowTaskModal(true);
  }, []);

  const onMonthChange = useCallback((month: any) => {
    setCurrentMonth(month.dateString);
  }, []);

  const getMarkedDates = useCallback(() => {
    const marked: any = {};
    const today = new Date().toDateString();
    const firstDate = new Date(getFirstTaskDate());
    const currentDate = new Date();
    
    // Mark dates from first use date to today
    const dateIterator = new Date(firstDate);
    while (dateIterator <= currentDate) {
      const dateString = dateIterator.toDateString();
      const isoDateString = dateIterator.toISOString().split('T')[0];
      
      if (hasCompletedTasksOnDate(dateString)) {
        // All tasks completed - green dot
        marked[isoDateString] = {
          marked: true,
          dotColor: COLORS.taskGreen,
        };
      } else if (hasTasksOnDate(dateString)) {
        // Some tasks but not all completed - yellow dot
        marked[isoDateString] = {
          marked: true,
          dotColor: COLORS.taskYellow,
        };
      }
      
      dateIterator.setDate(dateIterator.getDate() + 1);
    }

    // Highlight selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: COLORS.primary,
      };
    }

    return marked;
  }, [selectedDate, hasCompletedTasksOnDate, hasTasksOnDate, getFirstTaskDate]);

  const getDateStringFromISO = (isoDate: string) => {
    // Parse the ISO date and set to noon to avoid timezone issues
    const [year, month, day] = isoDate.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    return date.toDateString();
  };

  if (!fontsLoaded) {
    return null;
  }

  const tasksForSelectedDate = selectedDate ? getTasksForDate(getDateStringFromISO(selectedDate)) : [];

  const formatSelectedDate = (dateString: string) => {
    // Use the same timezone-safe parsing as getDateStringFromISO
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 12, 0, 0);
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const getMinDate = () => {
    return getFirstTaskDate() ? new Date(getFirstTaskDate()).toISOString().split('T')[0] : undefined;
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Task Calendar</Text>
          <Text style={styles.subtitle}>Track your productivity journey</Text>
        </View>

        <View style={styles.calendarContainer}>
          <Calendar
            current={currentMonth}
            minDate={getMinDate()}
            maxDate={new Date().toISOString().split('T')[0]}
            onDayPress={onDayPress}
            onMonthChange={onMonthChange}
            markedDates={getMarkedDates()}
            theme={{
              backgroundColor: COLORS.background,
              calendarBackground: COLORS.cardBackground,
              textSectionTitleColor: COLORS.textSecondary,
              selectedDayBackgroundColor: COLORS.primary,
              selectedDayTextColor: 'white',
              todayTextColor: COLORS.primary,
              dayTextColor: COLORS.text,
              textDisabledColor: COLORS.textSecondary,
              dotColor: COLORS.primary,
              selectedDotColor: 'white',
              arrowColor: COLORS.primary,
              disabledArrowColor: COLORS.textSecondary,
              monthTextColor: COLORS.text,
              indicatorColor: COLORS.primary,
              textDayFontFamily: 'Poppins_400Regular',
              textMonthFontFamily: 'Poppins_600SemiBold',
              textDayHeaderFontFamily: 'Poppins_500Medium',
              textDayFontSize: 16,
              textMonthFontSize: 18,
              textDayHeaderFontSize: 14,
            }}
            style={styles.calendar}
            renderArrow={(direction: string) => (
              direction === 'left' ? 
                <ChevronLeft size={20} color={COLORS.primary} /> : 
                <ChevronRight size={20} color={COLORS.primary} />
            )}
          />
        </View>

        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.taskGreen }]} />
            <Text style={styles.legendText}>All tasks completed</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: COLORS.taskYellow }]} />
            <Text style={styles.legendText}>Tasks set but incomplete</Text>
          </View>
        </View>

        {/* Task History Modal */}
        <Modal
          visible={showTaskModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowTaskModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <View>
                  <Text style={styles.modalTitle}>Tasks for</Text>
                  <Text style={styles.modalDate}>
                    {selectedDate ? formatSelectedDate(selectedDate) : ""}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => setShowTaskModal(false)}
                  style={styles.closeButton}
                >
                  <X size={24} color={COLORS.textSecondary} />
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
                {tasksForSelectedDate.length > 0 ? (
                  tasksForSelectedDate.map((task: Task, index: number) => (
                    <TaskHistoryCard key={task.id} task={task} index={index} />
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No tasks for this day</Text>
                    <Text style={styles.emptySubtitle}>
                      You didn't set any tasks on this date
                    </Text>
                  </View>
                )}
              </ScrollView>
            </View>
          </View>
        </Modal>
      </SafeAreaView>
    </View>
  );
}

interface TaskHistoryCardProps {
  task: Task;
  index: number;
}

function TaskHistoryCard({ task, index }: TaskHistoryCardProps) {
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

  return (
    <View style={[styles.taskHistoryCard, { backgroundColor: getTaskColor(index, task.completed) }]}>
      <View style={styles.taskHistoryContent}>
        <View style={styles.taskHistoryLeft}>
          <View style={[styles.priorityIndicator, { backgroundColor: "rgba(0,0,0,0.2)" }]}>
            <Text style={styles.priorityLabel}>
              {task.completed ? "COMPLETED" : getTaskLabel(index)}
            </Text>
          </View>
          <Text style={[
            styles.taskHistoryTitle,
            task.completed && styles.taskTitleCompleted
          ]}>
            {task.title}
          </Text>
          {task.notes && (
            <Text style={styles.taskHistoryNotes} numberOfLines={2}>
              {task.notes}
            </Text>
          )}
          {task.subBullets.length > 0 && (
            <Text style={styles.subBulletCount}>
              {task.subBullets.filter(b => b.completed).length}/{task.subBullets.length} sub-tasks completed
            </Text>
          )}
        </View>
        
        <View style={[
          styles.checkbox,
          task.completed && styles.checkboxCompleted
        ]}>
          {task.completed && <Check size={16} color="white" />}
        </View>
      </View>
    </View>
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
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
  },
  calendarContainer: {
    marginHorizontal: 20,
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  legend: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "center",
    paddingTop: 60,
    paddingBottom: 40,
  },
  modalContent: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 24,
    paddingTop: 32,
    paddingHorizontal: 24,
    maxHeight: "75%",
    minHeight: 300,
    marginHorizontal: 16,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
  },
  modalDate: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  modalScroll: {
    flex: 1,
    marginBottom: 20,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  taskHistoryCard: {
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  taskHistoryContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
  },
  taskHistoryLeft: {
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
  taskHistoryTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
    marginBottom: 6,
  },
  taskTitleCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  taskHistoryNotes: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.text,
    marginTop: 4,
    lineHeight: 20,
  },
  subBulletCount: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.text,
    marginTop: 6,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },
  checkboxCompleted: {
    backgroundColor: COLORS.taskGreen,
    borderColor: COLORS.taskGreen,
  },
});
