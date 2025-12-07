import { StudyTask, DifficultyLevel } from './types';

export const SUBJECT_ICONS = [
  '📚', '🧮', '💻', '🎨', '🧬', '⚖️', '🌍', '🎼', '🏃', '🧠', '📝', '🔬'
];

export const MOCK_TASKS: StudyTask[] = [
  {
    id: '1',
    subject: 'Toán Cao Cấp',
    description: 'Ôn tập chương Tích phân',
    deadline: new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0],
    estimatedHours: 5,
    difficulty: DifficultyLevel.HARD,
    priority: 1,
    icon: '🧮'
  },
  {
    id: '2',
    subject: 'Triết học',
    description: 'Viết tiểu luận cuối kỳ',
    deadline: new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0],
    estimatedHours: 3,
    difficulty: DifficultyLevel.MEDIUM,
    priority: 2,
    icon: '⚖️'
  },
  {
    id: '3',
    subject: 'Lập trình Web',
    description: 'Hoàn thiện Project Frontend',
    deadline: new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0],
    estimatedHours: 8,
    difficulty: DifficultyLevel.VERY_HARD,
    priority: 1,
    icon: '💻'
  }
];

export const DIFFICULTY_SCORE = {
  [DifficultyLevel.EASY]: 1,
  [DifficultyLevel.MEDIUM]: 2,
  [DifficultyLevel.HARD]: 3,
  [DifficultyLevel.VERY_HARD]: 4,
};

// Updated with Curated Modern Pastel Palettes
// [Primary, Secondary, Accent, SoftBackground]
export const THEMES = {
  OCEAN: {
    id: 'ocean',
    name: 'Đại Dương',
    // Soft Blue, Sky, Indigo, Violet
    palette: ['#60A5FA', '#38BDF8', '#818CF8', '#A78BFA'] 
  },
  SUNSET: {
    id: 'sunset',
    name: 'Hoàng Hôn',
    // Peach, Rose, Pink, Lilac
    palette: ['#FB923C', '#FB7185', '#F472B6', '#C084FC']
  },
  ROYAL: {
    id: 'royal',
    name: 'Hoàng Gia',
    // Violet, Purple, Fuchsia, Indigo
    palette: ['#8B5CF6', '#A855F7', '#D946EF', '#6366F1']
  },
  FOREST: {
    id: 'forest',
    name: 'Rừng Xanh',
    // Emerald, Teal, Lime, Green
    palette: ['#34D399', '#2DD4BF', '#A3E635', '#4ADE80']
  }
};