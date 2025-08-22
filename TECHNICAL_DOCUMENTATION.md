# Rule of 3 Productivity App - Technical Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture & Tech Stack](#architecture--tech-stack)
3. [Project Structure](#project-structure)
4. [Core Components](#core-components)
5. [State Management](#state-management)
6. [Data Models](#data-models)
7. [Key Features](#key-features)
8. [Configuration](#configuration)
9. [Development Workflow](#development-workflow)
10. [Adding New Features](#adding-new-features)
11. [Troubleshooting](#troubleshooting)

---

## Project Overview

The Rule of 3 Productivity App is a React Native mobile application built with Expo that helps users focus on their top 3 daily priorities. The core philosophy is that by limiting yourself to just 3 tasks per day, you can maintain focus and actually complete important work.

### Core Functionality
- **Daily Task Management**: Set exactly 3 tasks each day with priority ordering
- **Calendar & Historical Tracking**: View task history with visual calendar interface
- **Drag & Drop Reordering**: Intuitive reordering of tasks by dragging
- **Streak Tracking**: Gamified daily completion streaks  
- **Achievement System**: Unlock achievements based on consistency and total tasks completed
- **Task Details**: Add notes and sub-tasks to main tasks
- **Persistent Storage**: All data saved locally using AsyncStorage with historical data

---

## Architecture & Tech Stack

### Primary Technologies
- **React Native**: `0.79.1` - Core mobile framework
- **Expo**: `^53.0.4` - Development platform and tooling
- **TypeScript**: `~5.8.3` - Type safety and better DX
- **Expo Router**: `~5.0.3` - File-based navigation system

### Key Dependencies
- **react-native-gesture-handler**: `~2.24.0` - Touch gesture handling (drag & drop)
- **@react-native-async-storage/async-storage**: `2.1.2` - Local data persistence
- **react-native-calendars**: `^1.1313.0` - Calendar component for historical task tracking
- **lucide-react-native**: `^0.475.0` - Icon library
- **expo-haptics**: `~14.1.4` - Tactile feedback
- **@expo-google-fonts/poppins**: `^0.4.0` - Typography
- **zustand**: `^5.0.2` - Lightweight state management (potential future use)

### React Native New Architecture
The app is configured with `"newArchEnabled": true` in `app.json`, enabling React Native's modern architecture (Fabric and TurboModules) for better performance.

---

## Project Structure

```
rork-ruleof3-productivity-app/
├── app/                          # Expo Router file-based routing
│   ├── _layout.tsx              # Root layout with providers
│   ├── task-detail.tsx          # Task detail modal screen
│   └── (tabs)/                  # Tab navigation group
│       ├── _layout.tsx          # Tab layout configuration
│       ├── index.tsx            # Main home screen (Today tab)
│       ├── calendar.tsx         # Calendar screen with historical task tracking
│       └── achievements.tsx     # Achievements screen
├── providers/
│   └── TaskProvider.tsx         # Main state management with historical data
├── types/
│   └── task.ts                  # TypeScript interfaces (enhanced with historical types)
├── constants/
│   ├── colors.ts                # App color scheme
│   └── achievements.ts          # Achievement definitions
├── assets/                      # Images and static files
├── babel.config.js              # Babel configuration
├── app.json                     # Expo configuration
├── package.json                 # Dependencies and scripts
└── tsconfig.json               # TypeScript configuration
```

---

## Core Components

### 1. HomeScreen (`app/(tabs)/index.tsx`)
The main screen where users interact with their daily tasks.

**Key Features:**
- Task display with priority color coding (green → yellow → red)
- Drag & drop reordering functionality
- Edit mode toggle
- Daily task setup modal
- Streak display
- Completion status tracking

**State Management:**
- `isEditMode`: Toggles drag & drop functionality
- `showSetupModal`: Controls task setup modal visibility
- `dragState`: Tracks active drag operations
- `newTasks`: Temporary state for task creation

**Drag & Drop Implementation:**
```typescript
// Uses PanGestureHandler for touch gesture detection
<PanGestureHandler
  enabled={isEditMode && !task.completed}
  activeOffsetY={[-15, 15]}
  onGestureEvent={onGestureEvent}
  onHandlerStateChange={onHandlerStateChange}
>
```

### 2. TaskDetailScreen (`app/task-detail.tsx`)
Modal screen for editing individual task details.

**Features:**
- Notes editing
- Sub-task management (max 3 per task)
- Sub-task completion tracking
- Auto-save functionality

### 3. AchievementsScreen (`app/(tabs)/achievements.tsx`)
Gamification screen showing user progress and unlocked achievements.

**Features:**
- Statistics display (current streak, best streak, total tasks)
- Achievement cards with progress tracking
- Tier-based achievement system (Bronze, Silver, Gold)
- Visual progress bars for locked achievements

---

## State Management

### TaskProvider (`providers/TaskProvider.tsx`)
The app uses React Context for state management with the `@nkzw/create-context-hook` library.

**Core State:**
```typescript
const [tasks, setTasks] = useState<Task[]>([]);
const [streak, setStreak] = useState(0);
const [longestStreak, setLongestStreak] = useState(0);
const [totalTasksCompleted, setTotalTasksCompleted] = useState(0);
const [lastCompletedDate, setLastCompletedDate] = useState<string | null>(null);
const [hasSetTasksToday, setHasSetTasksToday] = useState(false);
```

**Key Functions:**
- `setDailyTasks(taskTitles: string[])`: Creates new daily tasks
- `toggleTaskComplete(taskId: string)`: Marks tasks as complete/incomplete
- `reorderTasks(fromIndex: number, toIndex: number)`: Handles drag & drop reordering
- `updateTaskDetails(taskId: string, notes: string, subBullets: SubBullet[])`: Updates task details

**Persistence:**
All state is automatically persisted to AsyncStorage whenever it changes. The provider handles:
- Daily reset logic (new day = fresh tasks)
- Streak calculation based on completion patterns
- Cross-session data recovery

---

## Data Models

### Task Interface (`types/task.ts`)
```typescript
export interface Task {
  id: string;           // Unique identifier
  title: string;        // Task title/description
  completed: boolean;   // Completion status
  notes: string;        // Additional notes
  subBullets: SubBullet[]; // Sub-tasks (max 3)
  createdAt: string;    // ISO timestamp
}
```

### SubBullet Interface
```typescript
export interface SubBullet {
  id: string;           // Unique identifier
  text: string;         // Sub-task description
  completed: boolean;   // Completion status
}
```

### AppState Interface
```typescript
export interface AppState {
  tasks: Task[];
  streak: number;
  longestStreak: number;
  totalTasksCompleted: number;
  lastCompletedDate: string | null;
  lastActiveDate: string;
  hasSetTasksToday: boolean;
}
```

---

## Key Features

### 1. Drag & Drop Reordering
**Implementation Location:** `app/(tabs)/index.tsx` - `DraggableTaskCard` component

**How It Works:**
- Uses `PanGestureHandler` from `react-native-gesture-handler`
- Only enabled in edit mode for incomplete tasks
- Gesture detection with `activeOffsetY={[-15, 15]}` for vertical drag sensitivity
- Real-time position tracking with `onDragMove` callback
- Automatic reordering via `reorderTasks` function on gesture end

**Technical Details:**
- Thread-safe state updates to prevent iOS crashes
- Visual feedback with opacity changes during drag
- Disabled scroll view during active drag operations
- Haptic feedback for drag start/end events

### 2. Streak System
**Logic Location:** `providers/TaskProvider.tsx` in `toggleTaskComplete` function

**Rules:**
- Streak increments when all 3 tasks are completed on a new day
- Streak resets if a day is missed without completion
- Longest streak is tracked separately for achievements
- Date comparison uses `toDateString()` for day-level precision

### 3. Achievement System
**Configuration:** `constants/achievements.ts`
**UI Implementation:** `app/(tabs)/achievements.tsx`

**Achievement Types:**
- `streak`: Based on current consecutive days
- `total`: Based on lifetime completed tasks
- `longest`: Based on best historical streak

**Tiers:**
- **Bronze**: Entry-level achievements
- **Silver**: Moderate challenges
- **Gold**: Elite accomplishments

### 4. Task Priority System
Tasks are automatically assigned priority labels based on their position:
- Position 0: "DOING NOW" (Green)
- Position 1: "UP NEXT" (Yellow)  
- Position 2: "LATER" (Red)

Colors are defined in `constants/colors.ts` and applied via the `getTaskColor()` function.

---

## Configuration

### Expo Configuration (`app.json`)
```json
{
  "expo": {
    "newArchEnabled": true,        // React Native New Architecture
    "orientation": "portrait",     // Mobile-only orientation
    "userInterfaceStyle": "automatic"
  }
}
```

### Babel Configuration (`babel.config.js`)
Basic Expo preset configuration. The react-native-gesture-handler works out of the box with this setup.

### Font Configuration
Uses Google Fonts (Poppins family) with these weights:
- `Poppins_400Regular`: Body text
- `Poppins_500Medium`: Input fields
- `Poppins_600SemiBold`: Headings and buttons
- `Poppins_700Bold`: Main titles and emphasis

---

## Development Workflow

### Starting Development
```bash
npm start                 # Start Expo development server
npm run ios              # Run on iOS simulator
npm run android          # Run on Android emulator
npm run web              # Run in web browser
```

### Project Commands
```bash
npm run lint             # Run ESLint
npm run build:ios        # Build for iOS
npm run build:android    # Build for Android
```

### Development Notes
- Hot reloading enabled by default
- TypeScript compilation happens automatically
- Use Expo Go app for device testing during development

---

## Adding New Features

### 1. Adding New Screens

**Step 1:** Create the screen file in the `app/` directory following Expo Router conventions
```typescript
// app/new-screen.tsx
export default function NewScreen() {
  return <View>...</View>;
}
```

**Step 2:** Update navigation if needed (for tab screens, modify `app/(tabs)/_layout.tsx`)

### 2. Extending Task Functionality

**Adding New Task Properties:**
1. Update `Task` interface in `types/task.ts`
2. Update `TaskProvider` state management functions
3. Modify task creation in `setDailyTasks` function
4. Update UI components to display new properties

**Example:**
```typescript
// types/task.ts
export interface Task {
  // ... existing properties
  category?: string;     // New property
  dueTime?: string;      // New property
}
```

### 3. Adding New Achievement Types

**Step 1:** Add new achievement type to `constants/achievements.ts`
```typescript
{
  id: "category-master",
  title: "Category Master", 
  description: "Complete tasks in 5 different categories",
  requirement: 5,
  type: "categories",      // New type
  icon: "tag",
  color: "#8B5CF6",
  tier: "SILVER",
}
```

**Step 2:** Update achievement checking logic in `achievements.tsx`
```typescript
const isAchievementUnlocked = (achievement) => {
  switch (achievement.type) {
    // ... existing cases
    case "categories":
      return uniqueCategories.length >= achievement.requirement;
  }
};
```

### 4. Modifying Colors and Styling

**Global Colors:** Update `constants/colors.ts`
```typescript
export const COLORS = {
  // Add new colors here
  newFeatureColor: "#FF6B6B",
};
```

**Component Styling:** Each component has its own `StyleSheet.create()` object at the bottom of the file.

### 5. Adding Haptic Feedback
Use the existing pattern:
```typescript
if (Platform.OS !== 'web') {
  await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
}
```

**Feedback Types:**
- `Light`: Subtle feedback
- `Medium`: Standard feedback  
- `Heavy`: Strong feedback
- `notificationAsync`: Success/error/warning notifications

---

## Troubleshooting

### Common Issues

**1. Gesture Handler Not Working**
- Ensure `GestureHandlerRootView` wraps the app in `app/_layout.tsx`
- Check that `react-native-gesture-handler` is properly installed
- Verify New Architecture compatibility

**2. Drag and Drop Crashes**
- Check for animation conflicts between native and JS drivers
- Ensure `useNativeDriver: true` consistency across animations
- Verify proper thread handling in gesture callbacks

**3. AsyncStorage Issues**
- Clear storage during development: `AsyncStorage.clear()`
- Check for JSON parsing errors in `loadAppState()`
- Verify data structure matches interfaces

**4. Font Loading Issues**
- Ensure fonts are loaded before rendering: `if (!fontsLoaded) return null;`
- Check font family names match exactly with imported font names
- Verify font loading in useEffect hooks

**5. Performance Issues**
- Use `useNativeDriver: true` for transform and opacity animations
- Implement proper key props for FlatList/map operations
- Avoid inline object creation in render methods

**6. Build Issues**
- Clear Metro cache: `npx expo start --clear`
- Reset node_modules: `rm -rf node_modules && npm install`
- Check for TypeScript errors: `npx tsc --noEmit`

---

## Code Patterns & Best Practices

### 1. Component Structure
Each screen follows this pattern:
```typescript
export default function ScreenName() {
  // 1. Font loading
  const [fontsLoaded] = useFonts({...});
  
  // 2. Context/state hooks
  const { tasks, ... } = useTasks();
  
  // 3. Local state
  const [localState, setLocalState] = useState();
  
  // 4. Effects
  useEffect(() => {}, []);
  
  // 5. Early returns
  if (!fontsLoaded) return null;
  
  // 6. Event handlers
  const handleAction = () => {};
  
  // 7. Render
  return <View>...</View>;
}
```

### 2. Styling Conventions
- Use `StyleSheet.create()` at the bottom of each file
- Follow consistent naming: `container`, `header`, `content`, etc.
- Use constants from `COLORS` object for all colors
- Implement responsive spacing with consistent values (8, 12, 16, 20, 24)

### 3. Haptic Feedback Pattern
```typescript
const handleInteraction = async () => {
  if (Platform.OS !== 'web') {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
  // ... interaction logic
};
```

### 4. Error Handling
Critical operations include try-catch blocks:
```typescript
const criticalFunction = () => {
  try {
    // ... operation
  } catch (error) {
    console.error("Error description:", error);
    // Fallback behavior
  }
};
```

---

## Testing Strategy

### Manual Testing Checklist

**Core Functionality:**
- [ ] Task creation (exactly 3 required)
- [ ] Task completion toggling
- [ ] Drag & drop reordering in edit mode
- [ ] Task detail editing (notes + sub-tasks)
- [ ] Streak calculation accuracy
- [ ] Achievement unlocking
- [ ] Data persistence across app restarts

**Edge Cases:**
- [ ] App behavior on new day (task reset)
- [ ] Incomplete task day (streak handling)
- [ ] Maximum sub-tasks (3 limit)
- [ ] Long task titles/notes
- [ ] Rapid gesture interactions

**Platform Testing:**
- [ ] iOS gesture handling
- [ ] Android gesture handling  
- [ ] Haptic feedback on supported devices
- [ ] Font rendering across devices
- [ ] Safe area handling on different screen sizes

---

## Performance Optimization

### Current Optimizations
1. **Native Driver Usage**: Animations use `useNativeDriver: true` where possible
2. **Gesture Handler Optimization**: Proper activeOffset configuration
3. **Conditional Rendering**: Components only render when needed
4. **Memoization**: Stable animation values prevent unnecessary re-renders

### Future Optimization Opportunities
1. **FlatList Implementation**: For large task lists, replace map() with FlatList
2. **Gesture Response Optimization**: Use shared values for better performance
3. **Image Optimization**: Implement proper asset optimization
4. **Bundle Optimization**: Code splitting for non-critical features

---

## Security Considerations

### Data Handling
- All data stored locally (no server communication)
- AsyncStorage provides app-sandboxed storage
- No sensitive data collection or transmission

### Privacy
- No analytics or tracking implemented
- No external API calls
- Fully offline functionality

---

## Deployment

### iOS Deployment
```bash
expo build:ios
# Follow Expo documentation for App Store submission
```

### Android Deployment  
```bash
expo build:android
# Follow Expo documentation for Google Play submission
```

### Development Builds
```bash
expo install --fix  # Ensure compatible dependencies
expo prebuild        # Generate native directories if needed
```

---

## Future Enhancement Ideas

### Feature Roadmap
1. **Categories/Tags**: Task categorization system
2. **Time Tracking**: Pomodoro timer integration
3. **Data Export**: Backup/restore functionality
4. **Widgets**: iOS/Android home screen widgets
5. **Notifications**: Smart reminders based on task priority
6. **Analytics**: Personal productivity insights
7. **Cloud Sync**: Optional cloud backup
8. **Team Features**: Shared task accountability

### Technical Improvements
1. **Performance**: Migrate to Reanimated 3 for smoother animations
2. **Testing**: Add Jest unit tests and Detox E2E tests
3. **CI/CD**: Automated build and deployment pipeline
4. **Monitoring**: Crash reporting and performance monitoring
5. **Accessibility**: VoiceOver/TalkBack support improvements

---

## Component API Reference

### DraggableTaskCard Props
```typescript
interface DraggableTaskCardProps {
  task: Task;                           // Task data object
  index: number;                        // Position in list
  color: string;                        // Background color
  label: string;                        // Priority label
  isEditMode: boolean;                  // Drag enabled state
  onPress: () => void;                  // Tap handler
  onToggleComplete: () => void;         // Completion toggle
  onDragStart: () => void;              // Drag start callback
  onDragMove: (y: number) => void;      // Drag move callback
  onDragEnd: () => void;                // Drag end callback
  isDragging: boolean;                  // Current drag state
  scaleAnim: Animated.Value;            // Scale animation value
}
```

### TaskProvider Context API
```typescript
const {
  tasks,                                // Current day's tasks
  streak,                               // Current consecutive days
  longestStreak,                        // Best historical streak
  totalTasksCompleted,                  // Lifetime completed tasks
  lastCompletedDate,                    // Last completion date
  hasSetTasksToday,                     // Whether tasks are set today
  setDailyTasks,                        // Create new daily tasks
  toggleTaskComplete,                   // Toggle task completion
  updateTaskDetails,                    // Update task notes/sub-tasks
  reorderTasks,                         // Reorder task positions
} = useTasks();
```

---

## Conclusion

This documentation provides a comprehensive overview of the Rule of 3 Productivity App architecture. The app demonstrates modern React Native development practices with proper state management, gesture handling, and user experience design.

For questions or contributions, refer to the codebase structure outlined above and follow the established patterns for consistency.

**Key Points for New Developers:**
- Start by understanding the TaskProvider state management
- Focus on the gesture handling implementation in HomeScreen
- Follow existing patterns for styling and haptic feedback
- Test thoroughly on both iOS and Android for gesture functionality
- Maintain the "Rule of 3" philosophy in any new features

The app is designed to be simple yet powerful, focusing on the core productivity principle that limiting daily tasks to just 3 items increases completion rates and reduces overwhelm.
