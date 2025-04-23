// Module and Lesson Types
export interface Module {
  id: string;
  title: string;
  order: number;
  description: string;
  lessons: Lesson[];
}

export interface Lesson {
  id: string;
  moduleId: string;
  moduleIndex: number;
  lessonIndex: number;
  totalLessonsInModule: number;
  title: string;
  description: string;
  duration: number; // in minutes
  status: 'locked' | 'available' | 'in_progress' | 'completed';
  lockReason?: string;
  progress?: number; // percentage complete
  rating?: number;
  prevLessonId?: string;
  prevLessonTitle?: string;
  nextLessonId?: string;
  nextLessonTitle?: string;
}

// Lesson Content Types
export interface LessonContent {
  id: string;
  lessonId: string;
  introduction: string;
  sections: ContentSection[];
  questions: Question[];
}

export type ContentSection = TextSection | ListSection | VideoSection;

export interface TextSection {
  type: 'text';
  content: string;
}

export interface ListSection {
  type: 'list';
  title: string;
  items: string[];
}

export interface VideoSection {
  type: 'video';
  url: string;
  caption: string;
}

// Question Types
export type Question = 
  | MultipleChoiceQuestion 
  | TrueFalseQuestion 
  | MatchingQuestion 
  | DragAndDropQuestion;

export interface BaseQuestion {
  id: string;
  type: string;
  order: number;
  text: string;
  points: number;
  explanation: string;
}

export interface MultipleChoiceQuestion extends BaseQuestion {
  type: 'multiple_choice';
  options: {
    id: string;
    text: string;
  }[];
  correctOption: string;
}

export interface TrueFalseQuestion extends BaseQuestion {
  type: 'true_false';
  correctAnswer: boolean;
}

export interface MatchingQuestion extends BaseQuestion {
  type: 'matching';
  leftItems: {
    id: string;
    text: string;
  }[];
  rightItems: {
    id: string;
    text: string;
  }[];
  correctMatches: Record<string, string>; // leftId -> rightId
}

export interface DragAndDropQuestion extends BaseQuestion {
  type: 'drag_and_drop';
  items: {
    id: string;
    text: string;
  }[];
  correctOrder: string[]; // array of item ids in correct order
}

// Answer Types
export interface QuestionAnswer {
  questionId: string;
  questionType: string;
  answer: any; // string for multiple choice, boolean for true/false, Record<string, string> for matching, string[] for drag-and-drop
  isCorrect: boolean;
  partialScore?: number; // for questions that can be partially correct (matching, drag-and-drop)
}

// User Types
export interface UserProgress {
  user_id: string;
  lesson_id: string;
  is_completed: boolean;
  score: number;
  max_score: number;
  progress: number;
  completion_date: string;
}

export interface UserStats {
  user_id: string;
  streak_days: number;
  points: number;
  completed_lessons: number;
}

// Supabase Tables
export interface Tables {
  users: {
    id: string;
    username: string;
    email: string;
    created_at: string;
  };
  user_progress: UserProgress;
  user_stats: UserStats;
}
