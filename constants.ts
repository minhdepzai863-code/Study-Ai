import { StudyTask, DifficultyLevel, PriorityLevel } from './types';

export const SUBJECT_ICONS = [
  '📚', '📐', '🔬', '💻', '🎨', '🧠', '🌍', '⚖️', '🧬', '📊', '🎵', '⚽'
];

export const MOCK_TASKS: StudyTask[] = [
  {
    id: '1',
    subject: 'Toán Cao Cấp',
    description: 'Bài tập Đại số tuyến tính chương 3',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    estimatedHours: 3.5,
    difficulty: DifficultyLevel.HARD,
    priority: PriorityLevel.HIGH,
    icon: '📐',
    isCompleted: false
  },
  {
    id: '2',
    subject: 'Triết Học',
    description: 'Tiểu luận về chủ nghĩa khắc kỷ',
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    estimatedHours: 5,
    difficulty: DifficultyLevel.MEDIUM,
    priority: PriorityLevel.MEDIUM,
    icon: '🧠',
    isCompleted: false
  },
  {
    id: '3',
    subject: 'Lập Trình Web',
    description: 'Project cuối kỳ: React App',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    estimatedHours: 8,
    difficulty: DifficultyLevel.VERY_HARD,
    priority: PriorityLevel.HIGH,
    icon: '💻',
    isCompleted: false
  }
];

export const DIFFICULTY_SCORE = {
  [DifficultyLevel.EASY]: 1,
  [DifficultyLevel.MEDIUM]: 2,
  [DifficultyLevel.HARD]: 3,
  [DifficultyLevel.VERY_HARD]: 4,
};

export const PRIORITY_SCORE = {
  [PriorityLevel.HIGH]: 3,
  [PriorityLevel.MEDIUM]: 2,
  [PriorityLevel.LOW]: 1,
};

// REFINED ACCESSIBLE PASTEL THEMES
export const THEMES = {
  SERENE: {
    id: 'serene',
    name: 'Thanh Bình',
    palette: ['#38bdf8', '#818cf8', '#c084fc', '#f0f9ff'] // Sky Blue -> Indigo
  },
  SUNRISE: {
    id: 'sunrise',
    name: 'Bình Minh',
    palette: ['#fb923c', '#fb7185', '#f472b6', '#fff7ed'] // Orange -> Pink
  },
  LAVENDER: {
    id: 'lavender',
    name: 'Oải Hương',
    palette: ['#a78bfa', '#c4b5fd', '#e879f9', '#faf5ff'] // Purple -> Fuchsia
  },
  MINT: {
    id: 'mint',
    name: 'Bạc Hà',
    palette: ['#34d399', '#6ee7b7', '#a3e635', '#f0fdfa'] // Emerald -> Lime
  }
};

// Gamification Config
export const LEVEL_TITLES = [
  'Novice Learner',
  'Apprentice Scholar',
  'Diligent Student',
  'Focus Master',
  'Grand Polymath'
];

export const XP_PER_TASK = 50;
export const XP_PER_FOCUS_SESSION = 100;

export const SOUND_ASSETS = {
  LOFI: 'https://cdn.pixabay.com/download/audio/2022/05/27/audio_1808fbf07a.mp3?filename=lofi-study-112778.mp3',
  RAIN: 'https://cdn.pixabay.com/download/audio/2021/08/09/audio_88447e769f.mp3?filename=rain-and-thunder-16705.mp3',
  ALARM: 'https://actions.google.com/sounds/v1/alarms/beep_short.ogg'
};