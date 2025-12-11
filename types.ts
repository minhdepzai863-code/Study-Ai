export enum DifficultyLevel {
  EASY = 'Dễ',
  MEDIUM = 'Trung bình',
  HARD = 'Khó',
  VERY_HARD = 'Rất khó'
}

export enum PriorityLevel {
  HIGH = 'Cao',
  MEDIUM = 'Trung bình',
  LOW = 'Thấp'
}

export interface StudyTask {
  id: string;
  subject: string;
  description: string;
  deadline: string; // ISO Date string
  estimatedHours: number;
  difficulty: DifficultyLevel;
  priority: PriorityLevel; 
  icon: string; // Emoji or icon code
  isCompleted?: boolean;
  customSessionDuration?: string; // Allow user to override AI recommendation
}

export interface StudentProfile {
  performance: 'Yếu' | 'Trung bình' | 'Khá' | 'Giỏi';
  energyLevel: number; // 1-10
}

export interface MindMapOptions {
  showDifficulty: boolean;
  showHours: boolean;
  showDeadline: boolean;
}

export interface AnalysisResult {
  totalHours: number;
  averageDifficulty: number;
  hardestSubject: string;
  burnoutRisk: 'Thấp' | 'Trung bình' | 'Cao';
}

export interface AIPlanResponse {
  markdownContent: string;
  isError: boolean;
}

export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
  };
}

// Gamification Types
export interface UserProfile {
  level: number;
  currentXP: number;
  nextLevelXP: number;
  streakDays: number;
  title: string;
}

export type TimerMode = 'FOCUS' | 'BREAK';

export interface FocusSession {
  taskId: string;
  duration: number;
  completedAt: Date;
}