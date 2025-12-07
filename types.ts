export enum DifficultyLevel {
  EASY = 'Dễ',
  MEDIUM = 'Trung bình',
  HARD = 'Khó',
  VERY_HARD = 'Rất khó'
}

export interface StudyTask {
  id: string;
  subject: string;
  description: string;
  deadline: string; // ISO Date string
  estimatedHours: number;
  difficulty: DifficultyLevel;
  priority: number; // Calculated or user defined
  icon: string; // Emoji or icon code
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