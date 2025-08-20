import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { X, Plus, Check, Trash2 } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useTasks } from "@/providers/TaskProvider";
import { COLORS } from "@/constants/colors";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

export default function TaskDetailScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { taskId } = useLocalSearchParams();
  const { tasks, updateTaskDetails } = useTasks();
  const task = tasks.find(t => t.id === taskId);
  
  const [notes, setNotes] = useState(task?.notes || "");
  const [subBullets, setSubBullets] = useState(task?.subBullets || []);
  const [newSubBullet, setNewSubBullet] = useState("");

  useEffect(() => {
    if (!task) {
      router.back();
    }
  }, [task]);

  if (!fontsLoaded) {
    return null;
  }

  if (!task) return null;

  const handleSave = () => {
    updateTaskDetails(task.id, notes, subBullets);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    router.back();
  };

  const handleAddSubBullet = () => {
    if (!newSubBullet.trim()) return;
    if (subBullets.length >= 3) {
      Alert.alert("Maximum Reached", "You can only add up to 3 sub-tasks");
      return;
    }
    
    const newBullet = {
      id: Date.now().toString(),
      text: newSubBullet.trim(),
      completed: false,
    };
    
    setSubBullets([...subBullets, newBullet]);
    setNewSubBullet("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const toggleSubBullet = (bulletId: string) => {
    setSubBullets(subBullets.map(b => 
      b.id === bulletId ? { ...b, completed: !b.completed } : b
    ));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const deleteSubBullet = (bulletId: string) => {
    setSubBullets(subBullets.filter(b => b.id !== bulletId));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <X size={24} color={COLORS.text} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Task Details</Text>
            <TouchableOpacity
              onPress={handleSave}
              style={styles.saveButton}
            >
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.taskHeader}>
              <Text style={styles.taskTitle}>{task.title}</Text>
              {task.completed && (
                <View style={styles.completedBadge}>
                  <Check size={16} color="white" />
                  <Text style={styles.completedText}>Completed</Text>
                </View>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Add notes about this task..."
                placeholderTextColor={COLORS.textSecondary}
                value={notes}
                onChangeText={setNotes}
                multiline
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Sub-tasks</Text>
                <Text style={styles.subTaskCount}>
                  {subBullets.length}/3
                </Text>
              </View>

              {subBullets.map((bullet) => (
                <View key={bullet.id} style={styles.subBulletItem}>
                  <TouchableOpacity
                    onPress={() => toggleSubBullet(bullet.id)}
                    style={[
                      styles.subBulletCheckbox,
                      bullet.completed && styles.subBulletCheckboxCompleted
                    ]}
                  >
                    {bullet.completed && <Check size={14} color="white" />}
                  </TouchableOpacity>
                  <Text style={[
                    styles.subBulletText,
                    bullet.completed && styles.subBulletTextCompleted
                  ]}>
                    {bullet.text}
                  </Text>
                  <TouchableOpacity
                    onPress={() => deleteSubBullet(bullet.id)}
                    style={styles.deleteButton}
                  >
                    <Trash2 size={16} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              ))}

              {subBullets.length < 3 && (
                <View style={styles.addSubBulletContainer}>
                  <TextInput
                    style={styles.addSubBulletInput}
                    placeholder="Add a sub-task..."
                    placeholderTextColor={COLORS.textSecondary}
                    value={newSubBullet}
                    onChangeText={setNewSubBullet}
                    onSubmitEditing={handleAddSubBullet}
                    returnKeyType="done"
                  />
                  <TouchableOpacity
                    onPress={handleAddSubBullet}
                    style={styles.addSubBulletButton}
                    disabled={!newSubBullet.trim()}
                  >
                    <Plus size={20} color={newSubBullet.trim() ? COLORS.primary : COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
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
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
  },
  saveButtonText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  taskHeader: {
    marginBottom: 24,
  },
  taskTitle: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
    marginBottom: 8,
  },
  completedBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: COLORS.taskGreen,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  completedText: {
    color: "white",
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
    marginBottom: 12,
  },
  subTaskCount: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
  },
  notesInput: {
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.text,
    minHeight: 120,
  },
  subBulletItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBackground,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  subBulletCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  subBulletCheckboxCompleted: {
    backgroundColor: COLORS.taskGreen,
    borderColor: COLORS.taskGreen,
  },
  subBulletText: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.text,
  },
  subBulletTextCompleted: {
    textDecorationLine: "line-through",
    color: COLORS.textSecondary,
  },
  deleteButton: {
    padding: 4,
  },
  addSubBulletContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  addSubBulletInput: {
    flex: 1,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: "Poppins_400Regular",
    color: COLORS.text,
    marginRight: 8,
  },
  addSubBulletButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.inputBackground,
    alignItems: "center",
    justifyContent: "center",
  },
});