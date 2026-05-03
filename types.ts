export enum UserMode {
  GENERAL = 'General',
  STUDENT = 'Student',
  EXAMINER = 'Examiner',
}

export interface Concept {
  title: string;
  description: string;
}

export interface Question {
  id: string;
  text: string;
  answer: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  priority?: 'High' | 'Medium' | 'Low'; // Student mode specific
  marks?: number; // Examiner mode specific
  topicRef?: string;
}

export interface CognifyResponse {
  summary: string;
  concepts: Concept[];
  questions: Question[];
  coverageAnalysis?: string; // Examiner mode specific
}

export interface Session {
  id: string;
  title: string;
  timestamp: number;
  mode: UserMode;
  data: CognifyResponse | null;
  history: { role: 'user' | 'model'; text: string }[];
}

export interface ProcessingState {
  status: 'idle' | 'processing' | 'success' | 'error';
  message?: string;
}