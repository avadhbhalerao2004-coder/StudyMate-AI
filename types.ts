import React from 'react';

export enum MessageRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  text: string;
  timestamp: number;
  isTyping?: boolean;
  imageUrl?: string; // Support for generated images
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  lastModified: number;
}

export interface QuizOption {
  id: string;
  text: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface GeneratedQuiz {
  topic: string;
  questions: QuizQuestion[];
}

export interface Flashcard {
  id: string;
  front: string;
  back: string;
  status: 'new' | 'known' | 'review';
}

export interface RoadmapStep {
  id: string;
  title: string;
  duration: string;
  description: string;
  keyTopics: string[];
}

export interface UserStats {
  streak: number;
  lastStudyDate: string; // ISO date string
  quizzesTaken: number;
  questionsAsked: number;
  correctAnswers: number;
  // Premium & Limits
  isPremium: boolean;
  imageGenCount: number;
  lastImageGenDate: string;
}

export interface ActivityLog {
  id: string;
  type: 'quiz' | 'chat' | 'summary' | 'live' | 'premium' | 'flashcards' | 'roadmap' | 'notes' | 'alert';
  topic: string; // e.g., "Quiz: Biology", "Chat about Math"
  timestamp: number;
  details?: string; // Score or duration
}

export type ViewMode = 'dashboard' | 'chat' | 'notes' | 'quiz' | 'live' | 'parents' | 'premium' | 'flashcards' | 'roadmap' | 'premium-notes';

export interface NavItem {
  id: ViewMode;
  label: string;
  icon: React.ReactNode;
  isPremium?: boolean;
}