export interface Chapter {
  id: string;
  title: string;
  summary: string;
  keyConcepts: string[];
}

export interface KeyTerm {
  term: string;
  definition: string;
  context?: string;
}

export interface TimingStats {
  readMs?: number;
  extractMs?: number;
  aiMs?: number;
  totalMs: number;
  isCached?: boolean;
  payloadSizeOriginal?: number;
  payloadSizeExtracted?: number;
  savingsPercentage?: number;
}

export interface MaterialAnalysis {
  id: string;
  title: string;
  subject: string;
  fileName?: string;
  fileSize?: string;
  pageCount?: number;
  wordCount?: number;
  createdAt: string;
  docHash?: string;
  rawTextPreview?: string;
  extractedText?: string; // Full extracted text cached for downstream features
  isScannedPdf?: boolean;
  modelUsed?: string;
  timingStats?: TimingStats;
  summary: string;
  chapters: Chapter[];
  keyTerms: KeyTerm[];
  examPointers: string[];
  reviewRecommendations: string[];
}

export type QuizType = 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
export type QuizDifficulty = 'mudah' | 'sedang' | 'sulit';

export interface QuizQuestion {
  id: string;
  type: QuizType;
  question: string;
  options?: string[]; // For multiple choice
  correctAnswer?: string; // Revealed only after submission or explicit check
  explanation?: string; // Revealed only after submission or explicit check
  chapterRef?: string; // Reference to chapter in material
  difficulty: QuizDifficulty;
  userAnswer?: string;
  isCorrect?: boolean;
}

export interface QuizResult {
  id: string;
  materialId: string;
  materialTitle: string;
  chapterTitle?: string;
  quizSessionId?: string;
  score: number;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  userAnswers: Record<string, string>;
  questions: QuizQuestion[];
  completedAt: string;
  weakTopics: string[];
  timingStats?: TimingStats;
}

export type FlashcardMastery = 'unlearned' | 'hard' | 'learning' | 'mastered';

export interface Flashcard {
  id: string;
  front: string; // Pertanyaan, istilah, konsep, definisi
  back: string; // Jawaban, penjelasan ringkas
  chapterRef?: string;
  mastery?: FlashcardMastery;
  lastReviewed?: string;
}

export interface PracticeQuestion {
  id: string;
  question: string;
  topic: string;
  chapterRef?: string;
  hints: string[]; // Gradual hints
  idealAnswer: string; // Ideal solution
  gradingCriteria: string[]; // Criteria
  explanation: string;
}

export interface PracticeEvaluation {
  score: number; // 0 - 100
  verdict: 'sempurna' | 'baik' | 'perlu_perbaikan' | 'belum_tepat';
  summaryFeedback: string;
  correctPoints: string[];
  missingOrInaccuratePoints: string[];
  actionableAdvice: string;
  timingStats?: TimingStats;
}

export interface ProblemSolutionStep {
  stepNumber: number;
  title: string;
  explanation: string;
  formulaOrCode?: string;
  reasoning: string;
}

export interface ProblemSolution {
  problem: string;
  topic: string;
  conceptsNeeded: string[];
  formulasNeeded?: string[];
  steps: ProblemSolutionStep[];
  finalAnswer: string;
  chapterReference?: string;
  additionalNotes?: string;
  missingInformationWarning?: string;
  timingStats?: TimingStats;
}

export interface StudyActivity {
  id: string;
  type: 'quiz' | 'flashcard' | 'practice' | 'solver';
  title: string;
  materialTitle: string;
  score?: number;
  date: string;
  details: string;
  timeSpentMs?: number;
}

export interface BenchmarkScenario {
  id: 'short' | 'medium' | 'long';
  title: string;
  pageEstimate: string;
  wordCount: number;
  description: string;
  sampleContent: string;
}

export interface BenchmarkRunResult {
  scenarioId: 'short' | 'medium' | 'long';
  scenarioTitle?: string;
  pages?: number;
  words?: number;
  model: string;
  unoptimizedTimeMs: number;
  optimizedTimeMs: number;
  timeSavedMs: number;
  percentFaster: number;
  extractionTimeMs: number;
  analysisTimeMs: number;
  quizTimeMs: number;
  flashcardTimeMs: number;
  cacheTimeMs: number;
  payloadOriginalKb: number;
  payloadOptimizedKb: number;
  payloadReductionPercent: number;
  testedAt: string;
}
