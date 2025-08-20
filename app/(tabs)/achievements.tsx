import React, { useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Animated,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Trophy, Flame, Target, Star, Award, Zap } from "lucide-react-native";
import { useTasks } from "@/providers/TaskProvider";
import { COLORS } from "@/constants/colors";
import { ACHIEVEMENTS, ACHIEVEMENT_TIERS } from "@/constants/achievements";
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';

export default function AchievementsScreen() {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
  });

  const { streak, totalTasksCompleted, longestStreak } = useTasks();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef(
    ACHIEVEMENTS.map(() => new Animated.Value(0.9))
  ).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();

    scaleAnims.forEach((anim, index) => {
      Animated.spring(anim, {
        toValue: 1,
        delay: index * 50,
        useNativeDriver: true,
      }).start();
    });
  }, []);

  if (!fontsLoaded) {
    return null;
  }

  const getIcon = (iconName: string, color: string, size: number = 32) => {
    const iconProps = { size, color };
    switch (iconName) {
      case "flame": return <Flame {...iconProps} />;
      case "trophy": return <Trophy {...iconProps} />;
      case "target": return <Target {...iconProps} />;
      case "star": return <Star {...iconProps} />;
      case "award": return <Award {...iconProps} />;
      case "zap": return <Zap {...iconProps} />;
      default: return <Trophy {...iconProps} />;
    }
  };

  const getTierStyle = (tier: keyof typeof ACHIEVEMENT_TIERS, unlocked: boolean) => {
    const tierData = ACHIEVEMENT_TIERS[tier];
    return {
      borderColor: unlocked ? tierData.borderColor : COLORS.border,
      shadowColor: unlocked ? tierData.shadowColor : '#000',
      backgroundColor: unlocked ? `${tierData.color}15` : COLORS.cardBackground,
    };
  };

  const isAchievementUnlocked = (achievement: typeof ACHIEVEMENTS[0]) => {
    switch (achievement.type) {
      case "streak":
        return streak >= achievement.requirement;
      case "total":
        return totalTasksCompleted >= achievement.requirement;
      case "longest":
        return longestStreak >= achievement.requirement;
      default:
        return false;
    }
  };

  const getProgress = (achievement: typeof ACHIEVEMENTS[0]) => {
    switch (achievement.type) {
      case "streak":
        return Math.min(streak / achievement.requirement, 1);
      case "total":
        return Math.min(totalTasksCompleted / achievement.requirement, 1);
      case "longest":
        return Math.min(longestStreak / achievement.requirement, 1);
      default:
        return 0;
    }
  };

  const getCurrentValue = (achievement: typeof ACHIEVEMENTS[0]) => {
    switch (achievement.type) {
      case "streak":
        return streak;
      case "total":
        return totalTasksCompleted;
      case "longest":
        return longestStreak;
      default:
        return 0;
    }
  };

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
          <Text style={styles.title}>Achievements</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statCard}>
              <Flame size={24} color={COLORS.flame} />
              <Text style={styles.statValue}>{streak}</Text>
              <Text style={styles.statLabel}>Current Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Trophy size={24} color={COLORS.gold} />
              <Text style={styles.statValue}>{longestStreak}</Text>
              <Text style={styles.statLabel}>Best Streak</Text>
            </View>
            <View style={styles.statCard}>
              <Target size={24} color={COLORS.primary} />
              <Text style={styles.statValue}>{totalTasksCompleted}</Text>
              <Text style={styles.statLabel}>Tasks Done</Text>
            </View>
          </View>
        </Animated.View>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.achievementsGrid}>
            {ACHIEVEMENTS.map((achievement, index) => {
              const unlocked = isAchievementUnlocked(achievement);
              const progress = getProgress(achievement);
              const currentValue = getCurrentValue(achievement);
              const tierStyle = getTierStyle(achievement.tier as keyof typeof ACHIEVEMENT_TIERS, unlocked);
              const tierData = ACHIEVEMENT_TIERS[achievement.tier as keyof typeof ACHIEVEMENT_TIERS];
              
              return (
                <Animated.View
                  key={achievement.id}
                  style={[
                    styles.achievementCard,
                    tierStyle,
                    unlocked && {
                      borderWidth: 3,
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      shadowOffset: { width: 0, height: 6 },
                      elevation: 8,
                    },
                    { transform: [{ scale: scaleAnims[index] }] }
                  ]}
                >
                  <View style={[
                    styles.tierBadge,
                    { backgroundColor: tierData.color }
                  ]}>
                    <Text style={styles.tierText}>{achievement.tier}</Text>
                  </View>

                  <View style={[
                    styles.iconContainer,
                    unlocked && {
                      backgroundColor: `${tierData.color}20`,
                      borderWidth: 2,
                      borderColor: tierData.borderColor,
                    }
                  ]}>
                    {getIcon(achievement.icon, unlocked ? achievement.color : COLORS.textSecondary, 36)}
                  </View>
                  
                  <Text style={[
                    styles.achievementTitle,
                    unlocked && { color: COLORS.text }
                  ]}>
                    {achievement.title}
                  </Text>
                  
                  <Text style={styles.achievementDescription}>
                    {achievement.description}
                  </Text>
                  
                  {!unlocked && (
                    <View>
                      <View style={styles.progressContainer}>
                        <View style={styles.progressBar}>
                          <View 
                            style={[
                              styles.progressFill,
                              { 
                                width: `${progress * 100}%`,
                                backgroundColor: achievement.color 
                              }
                            ]} 
                          />
                        </View>
                      </View>
                      <Text style={styles.progressText}>
                        {currentValue} / {achievement.requirement}
                      </Text>
                    </View>
                  )}
                  
                  {unlocked && (
                    <View style={[
                      styles.unlockedBadge,
                      { backgroundColor: `${tierData.color}20` }
                    ]}>
                      <Star size={18} color={tierData.color} fill={tierData.color} />
                      <Text style={[styles.unlockedText, { color: tierData.color }]}>
                        Unlocked!
                      </Text>
                    </View>
                  )}
                </Animated.View>
              );
            })}
          </View>
        </ScrollView>
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
  header: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  title: {
    fontSize: 32,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
    marginBottom: 20,
  },
  statsContainer: {
    flexDirection: "row",
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Poppins_700Bold",
    color: COLORS.text,
    marginTop: 8,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  achievementsGrid: {
    gap: 16,
  },
  achievementCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
    borderWidth: 2,
    borderColor: COLORS.border,
    position: 'relative',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.inputBackground,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementTitle: {
    fontSize: 18,
    fontFamily: "Poppins_600SemiBold",
    color: COLORS.text,
    marginBottom: 4,
  },
  achievementTitleUnlocked: {
    color: COLORS.text,
  },
  achievementDescription: {
    fontSize: 14,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: 12,
  },
  progressContainer: {
    width: "100%",
    marginTop: 8,
  },
  progressBar: {
    height: 12,
    backgroundColor: COLORS.inputBackground,
    borderRadius: 6,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  progressFill: {
    height: "100%",
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  progressText: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: COLORS.textSecondary,
    textAlign: "center",
    marginTop: 6,
  },
  tierBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    zIndex: 1,
  },
  tierText: {
    fontSize: 10,
    fontFamily: "Poppins_600SemiBold",
    color: '#000',
    textTransform: 'uppercase',
  },
  unlockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  unlockedText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
  },
});