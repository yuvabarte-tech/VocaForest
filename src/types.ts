export interface VocabularyItem {
  code: string; // e.g. V001
  word: string;
  meaning: string;
  example: string;
  pronunciation: string;
}

export interface StudentProgress {
  username: string;
  fullName: string;
  xp: number;
  level: number;
  avatar: string; // explorer, ranger, wizard, ninja, dino, astronaut
  unlockedTrophies: string[];
  lastActive: string;
  quizAttempts: number;
  correctAnswers: number;
  incorrectAnswers: number;
  failedWords: Record<string, number>; // word code -> count of incorrect answers
  lastAttemptedWords: { wordCode: string; correct: boolean; timestamp: string }[];
  assignedWords?: string[];
  streak?: number;
  pouchCount?: number;
  unlockedCards?: string[];
  pet?: { type: 'firefly' | 'fox' | 'guardian'; name: string; level: number; xp: number } | null;
  gameStats?: Record<string, { attempts: number; correct: number }>;
}

export interface TeacherNoticeboard {
  message: string;
  updatedAt: string;
}

export interface DashboardStats {
  totalXP: number;
  totalAttempts: number;
  accuracy: number;
  commonHardWords: { word: string; failCount: number }[];
  engagementTrend: { date: string; activeStudents: number }[];
}
