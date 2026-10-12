import React, { useState, useRef, useEffect } from 'react';
import {
  HelpCircle as HelpCircleIcon,
  Play as PlayIcon,
  RotateCcw as RotateCcwIcon,
  CheckCircle2 as CheckCircle2Icon,
  XCircle as XCircleIcon,
  AlertCircle as AlertCircleIcon,
  Loader2 as Loader2Icon,
  ChevronRight as ChevronRightIcon,
  ChevronLeft as ChevronLeftIcon,
  Award as AwardIcon,
  Send as SendIcon,
  Eye as EyeIcon,
  Shuffle as ShuffleIcon,
  Clock as ClockIcon,
  X as XIcon,
  Zap as ZapIcon,
  Cpu,
  BookOpen,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { MaterialAnalysis, QuizQuestion, QuizResult, QuizDifficulty, QuizType, TimingStats } from '../types';
import { Storage } from '../utils/storage';

interface QuizViewProps {
  material: MaterialAnalysis | null;
  onNavigateUpload: () => void;
  onOpenProblemSolver: (problemText: string) => void;
  preselectedChapter?: string;
  onStudyModeChange?: (isActive: boolean) => void;
}

export const QuizView: React.FC<QuizViewProps> = ({
  material,
  onNavigateUpload,
  onOpenProblemSolver,
  preselectedChapter,
  onStudyModeChange,
}) => {
  // Settings
  const [selectedChapter, setSelectedChapter] = useState<string>(preselectedChapter || 'all');
  const [difficulty, setDifficulty] = useState<QuizDifficulty>('sedang');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [selectedTypes, setSelectedTypes] = useState<QuizType[]>([
    'multiple_choice',
    'true_false',
    'short_answer',
  ]);
  const [shuffleOrder, setShuffleOrder] = useState<boolean>(true);
  const [practiceMode, setPracticeMode] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');

  // Generator & State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generationElapsed, setGenerationElapsed] = useState<number>(0);
  const [quizSessionId, setQuizSessionId] = useState<string>('');
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User input answers - state is strictly decoupled from solutions
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});

  // Practice mode: checked status per question (strictly explicit on-demand check)
  interface PracticeItemEvaluation {
    evaluated: boolean;
    isCorrect: boolean;
    correctAnswer: string;
    explanation: string;
    showExplanation: boolean; // default false: explanation stays hidden until user clicks "Lihat Pembahasan"
  }
  const [checkedPractice, setCheckedPractice] = useState<Record<string, PracticeItemEvaluation>>({});
  const [isCheckingSingle, setIsCheckingSingle] = useState(false);

  // Evaluation & Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [quizResult, setQuizResult] = useState<QuizResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timingStats, setTimingStats] = useState<TimingStats | null>(null);

  // Visibilities of explanations in final review (default FALSE so keys are hidden initially)
  const [expandedExplanations, setExpandedExplanations] = useState<Record<string, boolean>>({});

  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Manage study mode state (hiding sidebar during active quiz taking)
  useEffect(() => {
    const isTakingQuiz = quizQuestions.length > 0 && !isSubmitted;
    onStudyModeChange?.(isTakingQuiz);
    return () => {
      onStudyModeChange?.(false);
    };
  }, [quizQuestions.length, isSubmitted, onStudyModeChange]);

  if (!material) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <HelpCircleIcon className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Materi Kuliah Belum Dipilih</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Silakan unggah dokumen kuliah terlebih dahulu agar AI dapat menyusun soal kuis yang akurat.
        </p>
        <button
          onClick={onNavigateUpload}
          className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all"
        >
          Unggah Materi Kuliah
        </button>
      </div>
    );
  }

  const toggleType = (type: QuizType) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return;
      setSelectedTypes(selectedTypes.filter((t) => t !== type));
    } else {
      setSelectedTypes([...selectedTypes, type]);
    }
  };

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsGenerating(false);
    setGenerationStage('');
    setErrorMessage('Pembuatan kuis dibatalkan.');
  };

  const handleGenerateQuiz = async () => {
    setIsGenerating(true);
    setErrorMessage(null);
    setIsSubmitted(false);
    setUserAnswers({});
    setCheckedPractice({});
    setCurrentIndex(0);
    setQuizResult(null);
    setGenerationElapsed(0);
    setExpandedExplanations({});

    const controller = new AbortController();
    abortControllerRef.current = controller;

    timerRef.current = setInterval(() => {
      setGenerationElapsed((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    try {
      setGenerationStage('1. Menyiapkan konteks bab materi...');
      const chapterObj = material.chapters.find((c) => c.title === selectedChapter);
      const chapterText = chapterObj
        ? `Bab: ${chapterObj.title}. Ringkasan: ${chapterObj.summary}. Konsep: ${chapterObj.keyConcepts.join(', ')}`
        : material.extractedText?.slice(0, 30000) || material.summary;

      setGenerationStage('2. Menghasilkan soal kuis terstruktur dengan Gemini AI...');
      const response = await fetch('/api/generate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: material.id,
          materialSummary: material.summary,
          materialText: chapterText,
          chapterTitle: selectedChapter === 'all' ? undefined : selectedChapter,
          difficulty,
          count: questionCount,
          types: selectedTypes,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal menghasilkan kuis.');
      }

      setGenerationStage('3. Menyiapkan sesi kuis aman...');
      const data = await response.json();
      let questions: QuizQuestion[] = data.questions || [];

      if (shuffleOrder && questions.length > 1) {
        questions = [...questions].sort(() => Math.random() - 0.5);
      }

      setQuizSessionId(data.quizSessionId || '');
      setTimingStats(data.timingStats);
      setQuizQuestions(questions);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setErrorMessage(err.message || 'Gagal membuat quiz dengan AI. Silakan coba lagi.');
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsGenerating(false);
      setGenerationStage('');
      abortControllerRef.current = null;
    }
  };

  // Safe answer update: NEVER reveals answers or triggers evaluations
  // Any keystroke, deletion, or modification clears any prior evaluation for this question
  const handleAnswerChange = (questionId: string, answerText: string) => {
    if (isSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: answerText,
    }));

    // If user modifies, types, or deletes an answer in practice mode, immediately reset the checked state
    // so no answer key or explanation is shown while editing
    if (checkedPractice[questionId]) {
      setCheckedPractice((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  // Practice Mode: explicit on-demand check for a single question
  const handleCheckSinglePracticeQuestion = async (qId: string) => {
    const userAns = (userAnswers[qId] || '').trim();
    if (!userAns) {
      alert('Silakan pilih atau ketik jawaban Anda terlebih dahulu sebelum diperiksa.');
      return;
    }

    setIsCheckingSingle(true);
    try {
      const response = await fetch('/api/check-single-question', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizSessionId,
          questionId: qId,
          userAnswer: userAns,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal memeriksa soal ini.');
      }

      const res = await response.json();
      setCheckedPractice((prev) => ({
        ...prev,
        [qId]: {
          evaluated: true,
          isCorrect: res.isCorrect,
          correctAnswer: res.correctAnswer,
          explanation: res.explanation,
          showExplanation: false, // KEPT HIDDEN UNTIL USER CLICKS "Lihat Pembahasan"
        },
      }));
    } catch (err: any) {
      alert(err.message || 'Gagal memeriksa jawaban.');
    } finally {
      setIsCheckingSingle(false);
    }
  };

  const togglePracticeExplanation = (qId: string) => {
    setCheckedPractice((prev) => {
      if (!prev[qId]) return prev;
      return {
        ...prev,
        [qId]: {
          ...prev[qId],
          showExplanation: !prev[qId].showExplanation,
        },
      };
    });
  };

  const handleRetryPracticeQuestion = (qId: string) => {
    setUserAnswers((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
    setCheckedPractice((prev) => {
      const copy = { ...prev };
      delete copy[qId];
      return copy;
    });
  };

  // Submit Quiz for full server-side evaluation
  const handleSubmitQuiz = async () => {
    if (quizQuestions.length === 0 || isSubmitting) return;

    const unansweredCount = quizQuestions.filter((q) => !userAnswers[q.id]?.trim()).length;
    if (
      unansweredCount > 0 &&
      !confirm(`Masih ada ${unansweredCount} soal yang belum dijawab. Yakin ingin mengumpulkan kuis sekarang?`)
    ) {
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/evaluate-quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quizSessionId,
          userAnswers,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengevaluasi kuis di server.');
      }

      const evalData = await response.json();
      const evaluatedQuestions: QuizQuestion[] = evalData.evaluatedQuestions || [];

      const result: QuizResult = {
        id: 'quiz-res-' + Date.now(),
        materialId: material.id,
        materialTitle: material.title,
        chapterTitle: selectedChapter === 'all' ? 'Seluruh Bab' : selectedChapter,
        quizSessionId,
        score: evalData.score,
        totalQuestions: evalData.totalQuestions,
        correctCount: evalData.correctCount,
        incorrectCount: evalData.incorrectCount,
        userAnswers,
        questions: evaluatedQuestions,
        completedAt: new Date().toISOString(),
        weakTopics: evalData.weakTopics || [],
        timingStats: timingStats || undefined,
      };

      setQuizResult(result);
      setIsSubmitted(true);
      Storage.saveQuizResult(result);

      if (evalData.score >= 70) {
        try {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        } catch {}
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengumpulkan kuis. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleExplanation = (qId: string) => {
    setExpandedExplanations((prev) => ({
      ...prev,
      [qId]: !prev[qId],
    }));
  };

  const currentQ = quizQuestions[currentIndex];
  const currentPracticeChecked = currentQ ? checkedPractice[currentQ.id] : null;

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Settings / Generator Panel */}
      {quizQuestions.length === 0 && !isSubmitted && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
                <HelpCircleIcon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  AI Quiz Generator
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Materi: <span className="font-semibold text-slate-700">{material.title}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-600" />
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-slate-50 text-indigo-700 focus:outline-hidden"
              >
                <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Cepat ~1.2s)</option>
                <option value="gemini-3.8-flash">gemini-3.8-flash (Thinking Low)</option>
              </select>
            </div>
          </div>

          {errorMessage && (
            <div className="my-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircleIcon className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Stepper Status When Generating */}
          {isGenerating && (
            <div className="my-5 p-4 rounded-xl bg-indigo-50 border border-indigo-200 space-y-2 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 font-semibold text-indigo-950">
                  <Loader2Icon className="w-4 h-4 animate-spin text-indigo-600" />
                  <span>{generationStage}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-md border border-indigo-200">
                    {generationElapsed}s
                  </span>
                  <button
                    onClick={handleCancelGeneration}
                    className="text-rose-600 hover:bg-rose-100 px-2 py-0.5 rounded-md text-[11px] font-bold border border-rose-200"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="pt-6 space-y-6">
            {/* Topik / Bab Pilihan */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                1. Pilih Bab atau Topik
              </label>
              <select
                value={selectedChapter}
                onChange={(e) => setSelectedChapter(e.target.value)}
                className="w-full px-3.5 py-2.5 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
              >
                <option value="all">Seluruh Materi Kuliah (Semua Bab)</option>
                {material.chapters.map((ch, idx) => (
                  <option key={ch.id} value={ch.title}>
                    Bab {idx + 1}: {ch.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Tingkat Kesulitan */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                2. Tingkat Kesulitan Soal
              </label>
              <div className="grid grid-cols-3 gap-3">
                {(['mudah', 'sedang', 'sulit'] as QuizDifficulty[]).map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold capitalize transition-all border ${
                      difficulty === diff
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>

            {/* Jumlah Soal */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                3. Jumlah Soal (Disarankan 5 atau 10 untuk Kecepatan Maksimal)
              </label>
              <div className="grid grid-cols-4 gap-3">
                {[5, 10, 15, 20].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setQuestionCount(num)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all border ${
                      questionCount === num
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {num} Soal
                  </button>
                ))}
              </div>
            </div>

            {/* Jenis Soal */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2">
                4. Jenis Soal yang Diikutsertakan
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'multiple_choice', label: 'Pilihan Ganda' },
                  { id: 'true_false', label: 'Benar / Salah' },
                  { id: 'short_answer', label: 'Isian Singkat' },
                  { id: 'essay', label: 'Pertanyaan Esai' },
                ].map((item) => {
                  const isChecked = selectedTypes.includes(item.id as QuizType);
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => toggleType(item.id as QuizType)}
                      className={`p-3 rounded-xl text-xs font-medium text-left border transition-all ${
                        isChecked
                          ? 'border-indigo-500 bg-indigo-50/60 text-indigo-900 font-semibold'
                          : 'border-slate-200 bg-slate-50 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-400">Tipe</span>
                        <span
                          className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center text-[10px] ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-300'
                          }`}
                        >
                          {isChecked && '✓'}
                        </span>
                      </div>
                      <div>{item.label}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Opsi Acak dan Mode Latihan */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={shuffleOrder}
                  onChange={(e) => setShuffleOrder(e.target.checked)}
                  className="rounded-sm text-indigo-600"
                />
                <ShuffleIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Acak urutan soal</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={practiceMode}
                  onChange={(e) => setPracticeMode(e.target.checked)}
                  className="rounded-sm text-indigo-600"
                />
                <EyeIcon className="w-3.5 h-3.5 text-slate-500" />
                <span>Mode Latihan (Kunci diperiksa per soal melalui tombol)</span>
              </label>
            </div>

            <div className="pt-2">
              <button
                onClick={handleGenerateQuiz}
                disabled={isGenerating}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-sm shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-70"
              >
                {isGenerating ? (
                  <>
                    <Loader2Icon className="w-4 h-4 animate-spin" />
                    <span>Menghasilkan Soal ({generationElapsed}s)...</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4 fill-white" />
                    <span>Mulai Kerjakan Quiz Sekarang</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Active Quiz Taking Screen (FOCUS MODE) */}
      {quizQuestions.length > 0 && !isSubmitted && currentQ && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
                <span className="px-2 py-0.5 rounded-md bg-indigo-50 border border-indigo-100 uppercase tracking-wider text-[10px]">
                  {currentQ.type.replace('_', ' ')}
                </span>
                <span className="text-slate-400">•</span>
                <span className="capitalize">{currentQ.difficulty}</span>
                {currentQ.chapterRef && (
                  <>
                    <span className="text-slate-400">•</span>
                    <span className="text-slate-500 truncate max-w-xs">{currentQ.chapterRef}</span>
                  </>
                )}
              </div>
              <div className="text-sm font-bold text-slate-800">
                Soal {currentIndex + 1} dari {quizQuestions.length}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (confirm('Yakin ingin membatalkan kuis saat ini?')) {
                    setQuizQuestions([]);
                    setQuizSessionId('');
                    onStudyModeChange?.(false);
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-700 text-xs font-medium"
              >
                Batal
              </button>
              <button
                onClick={handleSubmitQuiz}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60"
              >
                {isSubmitting ? (
                  <>
                    <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                    <span>Memeriksa...</span>
                  </>
                ) : (
                  <>
                    <SendIcon className="w-3.5 h-3.5" />
                    <span>Kumpulkan & Lihat Nilai</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Navigator Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {quizQuestions.map((q, idx) => {
              const isAnswered = !!userAnswers[q.id]?.trim();
              const isCurrent = idx === currentIndex;
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(idx)}
                  className={`w-9 h-9 rounded-xl text-xs font-bold shrink-0 transition-all ${
                    isCurrent
                      ? 'bg-indigo-600 text-white ring-2 ring-indigo-300'
                      : isAnswered
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>

          {/* Question Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed">
              {currentQ.question}
            </h3>

            {/* Answer Options according to question type */}
            <div className="mt-6 space-y-3">
              {currentQ.type === 'multiple_choice' &&
                currentQ.options?.map((opt, optIdx) => {
                  const isSelected = userAnswers[currentQ.id] === opt;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      onClick={() => handleAnswerChange(currentQ.id, opt)}
                      className={`w-full text-left p-4 rounded-xl border text-xs sm:text-sm font-medium transition-all flex items-center justify-between ${
                        isSelected
                          ? 'border-indigo-600 bg-indigo-50/70 text-indigo-950 font-semibold shadow-xs'
                          : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/60 text-slate-700'
                      }`}
                    >
                      <span>{opt}</span>
                      <span
                        className={`w-5 h-5 rounded-full border flex items-center justify-center text-xs shrink-0 ml-3 ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-600 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isSelected && '✓'}
                      </span>
                    </button>
                  );
                })}

              {currentQ.type === 'true_false' && (
                <div className="grid grid-cols-2 gap-4">
                  {['Benar', 'Salah'].map((opt) => {
                    const isSelected = userAnswers[currentQ.id] === opt;
                    return (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => handleAnswerChange(currentQ.id, opt)}
                        className={`p-4 rounded-xl border text-sm font-bold text-center transition-all ${
                          isSelected
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-900 shadow-xs'
                            : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQ.type === 'short_answer' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Ketik jawaban singkat Anda:
                  </label>
                  <input
                    type="text"
                    value={userAnswers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    placeholder="Tuliskan kata kunci di sini..."
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">
                    Kunci jawaban tetap tersembunyi hingga kuis dikumpulkan atau diperiksa.
                  </p>
                </div>
              )}

              {currentQ.type === 'essay' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Uraikan penjelasan analitis Anda:
                  </label>
                  <textarea
                    rows={6}
                    value={userAnswers[currentQ.id] || ''}
                    onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
                    placeholder="Tuliskan penjelasan Anda..."
                    className="w-full p-3.5 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              )}
            </div>

            {/* Practice Mode: Explicit On-Demand Single-Question Check Button */}
            {practiceMode && (
              <div className="mt-6 pt-4 border-t border-slate-100">
                {!currentPracticeChecked?.evaluated ? (
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div className="text-xs text-slate-600">
                      <span className="font-bold text-slate-800">Mode Latihan:</span> Kunci & pembahasan tetap tersembunyi hingga Anda menekan tombol evaluasi.
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCheckSinglePracticeQuestion(currentQ.id)}
                      disabled={isCheckingSingle || !userAnswers[currentQ.id]?.trim()}
                      className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-xs disabled:opacity-40 disabled:hover:bg-indigo-600"
                    >
                      {isCheckingSingle ? (
                        <>
                          <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                          <span>Mengevaluasi...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2Icon className="w-3.5 h-3.5" />
                          <span>Kumpulkan & Evaluasi Soal Ini</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Evaluated state: explanation strictly hidden until clicking "Lihat Pembahasan" */
                  <div className="space-y-3">
                    <div
                      className={`p-4 rounded-xl text-xs space-y-3 border animate-in fade-in ${
                        currentPracticeChecked.isCorrect
                          ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                          : 'bg-amber-50/80 border-amber-200 text-amber-950'
                      }`}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-center gap-2 font-bold text-sm">
                          {currentPracticeChecked.isCorrect ? (
                            <>
                              <CheckCircle2Icon className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="text-emerald-800">Jawaban Anda Tepat!</span>
                            </>
                          ) : (
                            <>
                              <XCircleIcon className="w-4 h-4 text-amber-600 shrink-0" />
                              <span className="text-amber-800">Jawaban Anda Kurang Tepat</span>
                            </>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => togglePracticeExplanation(currentQ.id)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <EyeIcon className="w-3.5 h-3.5 text-indigo-600" />
                            <span>
                              {currentPracticeChecked.showExplanation
                                ? 'Tutup Pembahasan'
                                : 'Lihat Pembahasan & Kunci'}
                            </span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRetryPracticeQuestion(currentQ.id)}
                            className="px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors flex items-center gap-1.5"
                          >
                            <RotateCcwIcon className="w-3.5 h-3.5 text-slate-500" />
                            <span>Coba Jawab Ulang</span>
                          </button>
                        </div>
                      </div>

                      {/* Explanation displayed ONLY when user clicks "Lihat Pembahasan & Kunci" */}
                      {currentPracticeChecked.showExplanation && (
                        <div className="pt-3 border-t border-slate-200/60 space-y-2 animate-in fade-in">
                          <div className="p-3 rounded-lg bg-white/90 border border-slate-200">
                            <span className="font-bold text-slate-700">Kunci Jawaban: </span>
                            <span className="font-semibold text-indigo-900">{currentPracticeChecked.correctAnswer}</span>
                          </div>
                          <div className="p-3 rounded-lg bg-white/90 border border-slate-200">
                            <span className="font-bold text-slate-700 block mb-1">Pembahasan Lengkap:</span>
                            <p className="text-slate-600 leading-relaxed">{currentPracticeChecked.explanation}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="mt-8 pt-5 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
                disabled={currentIndex === 0}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 disabled:opacity-40 flex items-center gap-1"
              >
                <ChevronLeftIcon className="w-4 h-4" />
                <span>Sebelumnya</span>
              </button>

              {currentIndex < quizQuestions.length - 1 ? (
                <button
                  onClick={() =>
                    setCurrentIndex((prev) => Math.min(quizQuestions.length - 1, prev + 1))
                  }
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1"
                >
                  <span>Selanjutnya</span>
                  <ChevronRightIcon className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmitQuiz}
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2Icon className="w-3.5 h-3.5 animate-spin" />
                      <span>Mengevaluasi...</span>
                    </>
                  ) : (
                    <>
                      <SendIcon className="w-3.5 h-3.5" />
                      <span>Kumpulkan & Lihat Nilai</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quiz Results Screen (SIDEBAR RETURNS DOCKED NORMALLY) */}
      {isSubmitted && quizResult && (
        <div className="space-y-6 animate-in fade-in">
          <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 mb-2 border border-white/10">
                  <AwardIcon className="w-3.5 h-3.5 text-amber-300" />
                  <span>Hasil Quiz Selesai</span>
                </div>
                <h2 className="text-2xl font-extrabold">{quizResult.materialTitle}</h2>
                <p className="text-xs text-indigo-200 mt-1">
                  Topik: {quizResult.chapterTitle} • Selesai pada{' '}
                  {new Date(quizResult.completedAt).toLocaleTimeString('id-ID', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </p>

                {quizResult.timingStats && (
                  <div className="mt-2 text-[11px] text-emerald-300 flex items-center gap-1">
                    <ClockIcon className="w-3 h-3" />
                    <span>Dibuat dalam {(quizResult.timingStats.totalMs / 1000).toFixed(2)}s</span>
                    {quizResult.timingStats.isCached && <span>(Cache Hit)</span>}
                  </div>
                )}
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-6 border border-white/10 text-center min-w-[140px]">
                <div className="text-4xl sm:text-5xl font-black text-amber-300 tracking-tight">
                  {quizResult.score}
                </div>
                <div className="text-xs font-medium text-indigo-200 mt-1">
                  {quizResult.correctCount} dari {quizResult.totalQuestions} Benar
                </div>
              </div>
            </div>

            {quizResult.weakTopics.length > 0 && (
              <div className="mt-6 pt-5 border-t border-white/10">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300 mb-2">
                  <AlertCircleIcon className="w-4 h-4" />
                  <span>Rekomendasi Bagian Materi yang Perlu Dipelajari Kembali:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {quizResult.weakTopics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-lg bg-white/15 text-white text-xs font-medium border border-white/10"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                onClick={handleGenerateQuiz}
                className="px-4 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5"
              >
                <RotateCcwIcon className="w-3.5 h-3.5 text-indigo-600" />
                <span>Ulangi Quiz</span>
              </button>
              <button
                onClick={() => {
                  setQuizQuestions([]);
                  setIsSubmitted(false);
                  setQuizSessionId('');
                  onStudyModeChange?.(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/15 hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all"
              >
                Atur Pengaturan Baru
              </button>
            </div>
          </div>

          {/* Question Review List */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Pembahasan & Review Setiap Soal
                </h3>
                <p className="text-xs text-slate-500">
                  Kunci jawaban dan pembahasan dapat dibuka per soal menggunakan tombol di bawah ini.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const allOpen = quizResult.questions.every((q) => expandedExplanations[q.id]);
                  const nextState: Record<string, boolean> = {};
                  quizResult.questions.forEach((q) => {
                    nextState[q.id] = !allOpen;
                  });
                  setExpandedExplanations(nextState);
                }}
                className="self-start sm:self-auto text-xs font-semibold text-indigo-700 hover:text-indigo-900 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-200 transition-colors flex items-center gap-1.5"
              >
                <EyeIcon className="w-3.5 h-3.5" />
                <span>
                  {quizResult.questions.every((q) => expandedExplanations[q.id])
                    ? 'Tutup Semua Pembahasan'
                    : 'Buka Semua Pembahasan'}
                </span>
              </button>
            </div>

            {quizResult.questions.map((q, idx) => {
              const isCorrect = q.isCorrect ?? false;
              const userAns = q.userAnswer || (quizResult.userAnswers[q.id] || '').trim();
              const isExplanationOpen = !!expandedExplanations[q.id];

              return (
                <div
                  key={q.id}
                  className={`bg-white rounded-2xl border p-5 sm:p-6 transition-all ${
                    isCorrect
                      ? 'border-emerald-200 bg-emerald-50/10'
                      : 'border-rose-200 bg-rose-50/10'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-bold ${
                          isCorrect
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold text-slate-400 capitalize">
                        {q.type.replace('_', ' ')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                          <CheckCircle2Icon className="w-3.5 h-3.5" />
                          <span>Benar</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-0.5 rounded-full">
                          <XCircleIcon className="w-3.5 h-3.5" />
                          <span>Kurang Tepat</span>
                        </span>
                      )}

                      <button
                        onClick={() => toggleExplanation(q.id)}
                        className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1"
                      >
                        <EyeIcon className="w-3 h-3" />
                        <span>{isExplanationOpen ? 'Tutup Pembahasan' : 'Lihat Pembahasan'}</span>
                      </button>

                      <button
                        onClick={() => onOpenProblemSolver(q.question)}
                        className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors"
                      >
                        Analisis Mendalam AI
                      </button>
                    </div>
                  </div>

                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-relaxed mb-4">
                    {q.question}
                  </h4>

                  <div className="space-y-2 text-xs">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-start gap-2">
                      <span className="font-bold text-slate-500 shrink-0">Jawaban Anda:</span>
                      <span className={`font-semibold ${isCorrect ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {userAns || '(Tidak dijawab)'}
                      </span>
                    </div>

                    {isExplanationOpen && (
                      <div className="p-3 rounded-xl bg-indigo-50/70 border border-indigo-200 flex items-start gap-2">
                        <span className="font-bold text-indigo-800 shrink-0">Kunci Jawaban:</span>
                        <span className="font-semibold text-indigo-950">{q.correctAnswer}</span>
                      </div>
                    )}
                  </div>

                  {isExplanationOpen && q.explanation && (
                    <div className="mt-4 p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                      <span className="font-bold text-slate-700 block mb-1">
                        Penjelasan Berdasarkan Materi:
                      </span>
                      <p className="text-slate-600 leading-relaxed">{q.explanation}</p>
                      {q.chapterRef && (
                        <p className="text-[11px] text-indigo-600 font-medium mt-2">
                          Referensi Bab: {q.chapterRef}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
