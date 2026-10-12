import React, { useState, useRef } from 'react';
import {
  Edit3,
  HelpCircle,
  Lightbulb,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  ChevronRight,
  Eye,
  Loader2,
  Sparkles,
  Clock,
  Send,
  Cpu,
} from 'lucide-react';
import { MaterialAnalysis, PracticeQuestion, PracticeEvaluation, TimingStats } from '../types';
import { Storage } from '../utils/storage';

interface SelfPracticeViewProps {
  material: MaterialAnalysis | null;
  onNavigateUpload: () => void;
  preselectedChapter?: string;
}

export const SelfPracticeView: React.FC<SelfPracticeViewProps> = ({
  material,
  onNavigateUpload,
  preselectedChapter,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<string>(preselectedChapter || 'all');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questions, setQuestions] = useState<PracticeQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // User input per question
  const [userAnswer, setUserAnswer] = useState('');
  const [revealedHintCount, setRevealedHintCount] = useState<number>(0);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evalElapsedSeconds, setEvalElapsedSeconds] = useState(0);
  const [evaluation, setEvaluation] = useState<PracticeEvaluation | null>(null);
  const [showFullSolution, setShowFullSolution] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timingStats, setTimingStats] = useState<TimingStats | null>(null);

  const evalTimerRef = useRef<NodeJS.Timeout | null>(null);

  if (!material) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Edit3 className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Materi Kuliah Belum Dipilih</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Silakan unggah dokumen kuliah agar AI dapat menyusun soal latihan mandiri interaktif tanpa membocorkan jawaban.
        </p>
        <button
          onClick={onNavigateUpload}
          className="mt-5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-xs transition-all"
        >
          Unggah Materi Sekarang
        </button>
      </div>
    );
  }

  const handleGeneratePractice = async () => {
    setIsLoadingQuestions(true);
    setErrorMessage(null);
    setEvaluation(null);
    setUserAnswer('');
    setRevealedHintCount(0);
    setShowFullSolution(false);
    setCurrentIndex(0);

    try {
      const chapterObj = material.chapters.find((c) => c.title === selectedChapter);
      const chapterText = chapterObj
        ? `Bab: ${chapterObj.title}. Ringkasan: ${chapterObj.summary}. Konsep: ${chapterObj.keyConcepts.join(', ')}`
        : material.extractedText?.slice(0, 30000) || material.summary;

      const response = await fetch('/api/generate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialSummary: material.summary,
          materialText: chapterText,
          chapterTitle: selectedChapter === 'all' ? undefined : selectedChapter,
          count: 4,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal membuat soal latihan.');
      }

      const data = await response.json();
      setTimingStats(data.timingStats);
      setQuestions(data.questions || []);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menghasilkan latihan AI.');
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const currentQ = questions[currentIndex];

  const handleRevealNextHint = () => {
    if (!currentQ) return;
    if (revealedHintCount < (currentQ.hints?.length || 3)) {
      setRevealedHintCount((prev) => prev + 1);
    }
  };

  const handleEvaluateAnswer = async () => {
    if (!userAnswer.trim()) {
      setErrorMessage('Silakan ketik jawaban Anda terlebih dahulu sebelum diperiksa AI.');
      return;
    }

    setIsEvaluating(true);
    setErrorMessage(null);
    setEvalElapsedSeconds(0);

    evalTimerRef.current = setInterval(() => {
      setEvalElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    try {
      const response = await fetch('/api/evaluate-practice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: currentQ.question,
          userAnswer,
          idealAnswer: currentQ.idealAnswer,
          gradingCriteria: currentQ.gradingCriteria,
          materialContent: material.summary,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal mengevaluasi jawaban.');
      }

      const evalData: PracticeEvaluation = await response.json();
      setEvaluation(evalData);

      Storage.addActivity({
        id: 'prac-act-' + Date.now(),
        type: 'practice',
        title: `Latihan: ${currentQ.topic || 'Soal Mandiri'}`,
        materialTitle: material.title,
        score: evalData.score,
        date: new Date().toISOString(),
        details: `Skor ${evalData.score}/100 • Evaluasi AI: ${evalData.verdict}`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengevaluasi jawaban.');
    } finally {
      if (evalTimerRef.current) clearInterval(evalTimerRef.current);
      setIsEvaluating(false);
    }
  };

  const handleNextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setRevealedHintCount(0);
      setEvaluation(null);
      setShowFullSolution(false);
      setErrorMessage(null);
    }
  };

  const handleRetryCurrent = () => {
    setEvaluation(null);
    setShowFullSolution(false);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header Config */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <Edit3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">AI Latihan Mandiri</h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100">
                  Tanpa Bocoran Kunci
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ketik jawaban Anda sendiri, dapatkan evaluasi semantik mendalam & petunjuk bertahap dari AI
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Bab</option>
              {material.chapters.map((ch, idx) => (
                <option key={ch.id} value={ch.title}>
                  Bab {idx + 1}: {ch.title}
                </option>
              ))}
            </select>

            <button
              onClick={handleGeneratePractice}
              disabled={isLoadingQuestions}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {isLoadingQuestions ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Merumuskan Soal...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{questions.length === 0 ? 'Buat Soal Latihan' : 'Generate Ulang'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {timingStats && (
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>Soal latihan disiapkan dalam {(timingStats.totalMs / 1000).toFixed(2)} detik</span>
          </div>
        )}

        {errorMessage && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* When no questions generated yet */}
      {questions.length === 0 && !isLoadingQuestions && (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-xs">
          <Edit3 className="w-12 h-12 text-indigo-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            Uji Pemahaman Asli Tanpa Melihat Kunci Jawaban
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            AI akan memberikan soal studi kasus, penalaran, atau hitungan. Anda mengetik jawaban Anda sendiri, dan AI akan mengevaluasi ketepatan konsep serta memberikan arahan konstruktif.
          </p>
          <button
            onClick={handleGeneratePractice}
            className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Mulai Latihan Mandiri Sekarang</span>
          </button>
        </div>
      )}

      {/* Active Question Screen */}
      {questions.length > 0 && currentQ && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                  Soal Latihan {currentIndex + 1} dari {questions.length}
                </span>
                <span className="text-slate-500 font-medium">{currentQ.topic}</span>
              </div>
              {currentQ.chapterRef && (
                <span className="hidden sm:inline text-slate-400 text-[11px]">
                  Referensi: {currentQ.chapterRef}
                </span>
              )}
            </div>

            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-relaxed mb-6">
              {currentQ.question}
            </h3>

            {/* Answer Input Area */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">
                Tuliskan Jawaban Anda Sendiri:
              </label>
              <textarea
                rows={6}
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Ketik analisis, rumus, proses penalaran, atau kesimpulan Anda di sini..."
                className="w-full p-4 text-xs sm:text-sm rounded-2xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed text-slate-800 bg-slate-50/50 focus:bg-white"
              />
            </div>

            {/* Hint & Action Buttons Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleRevealNextHint}
                  disabled={revealedHintCount >= (currentQ.hints?.length || 3)}
                  className="px-3.5 py-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                  <span>
                    {revealedHintCount === 0
                      ? 'Minta Petunjuk'
                      : `Petunjuk (${revealedHintCount}/${currentQ.hints?.length || 3})`}
                  </span>
                </button>

                {!showFullSolution && (
                  <button
                    type="button"
                    onClick={() => {
                      if (
                        !evaluation &&
                        !confirm(
                          'Melihat pembahasan sebelum mencoba menjawab disarankan hanya jika sudah mentok. Lanjutkan?'
                        )
                      ) {
                        return;
                      }
                      setShowFullSolution(true);
                    }}
                    className="px-3 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Lihat Pembahasan Lengkap</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={handleEvaluateAnswer}
                disabled={isEvaluating || !userAnswer.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isEvaluating ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Memeriksa ({evalElapsedSeconds}s)...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Periksa Jawaban dengan AI</span>
                  </>
                )}
              </button>
            </div>

            {/* Revealed Hints Box */}
            {revealedHintCount > 0 && currentQ.hints && (
              <div className="mt-5 p-4 rounded-2xl bg-amber-50/60 border border-amber-200 text-xs space-y-2 animate-in fade-in duration-200">
                <div className="font-bold text-amber-900 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-amber-600" />
                  <span>Bantuan Bertahap (Tanpa Membocorkan Jawaban Akhir):</span>
                </div>
                {currentQ.hints.slice(0, revealedHintCount).map((hint, hIdx) => (
                  <div
                    key={hIdx}
                    className="p-2.5 rounded-xl bg-white/80 border border-amber-200/80 text-amber-800 text-xs"
                  >
                    <span className="font-bold mr-1.5">Petunjuk {hIdx + 1}:</span>
                    <span>{hint}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Semantic Evaluation Result */}
          {evaluation && (
            <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-xs animate-in fade-in slide-in-from-top-2 duration-300 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white font-black text-xl shadow-md ${
                      evaluation.score >= 85
                        ? 'bg-emerald-600 shadow-emerald-200'
                        : evaluation.score >= 70
                        ? 'bg-blue-600 shadow-blue-200'
                        : evaluation.score >= 50
                        ? 'bg-amber-600 shadow-amber-200'
                        : 'bg-rose-600 shadow-rose-200'
                    }`}
                  >
                    {evaluation.score}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-slate-900">
                        Hasil Evaluasi Jawaban
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                          evaluation.verdict === 'sempurna'
                            ? 'bg-emerald-100 text-emerald-800'
                            : evaluation.verdict === 'baik'
                            ? 'bg-blue-100 text-blue-800'
                            : evaluation.verdict === 'perlu_perbaikan'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {evaluation.verdict.replace('_', ' ')}
                      </span>
                    </div>
                    {evaluation.timingStats && (
                      <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Dievaluasi dalam {(evaluation.timingStats.totalMs / 1000).toFixed(2)} detik</span>
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleRetryCurrent}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 flex items-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Coba Lagi / Revisi</span>
                  </button>
                  <button
                    onClick={() => setShowFullSolution(!showFullSolution)}
                    className="px-3.5 py-2 text-xs font-semibold rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showFullSolution ? 'Sembunyikan Solusi' : 'Lihat Jawaban Ideal'}</span>
                  </button>
                </div>
              </div>

              {/* Summary feedback */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 leading-relaxed">
                <span className="font-bold text-slate-900 block mb-1">Ulasan Tutor AI:</span>
                {evaluation.summaryFeedback}
              </div>

              {/* Points Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-xs">
                  <div className="font-bold text-emerald-900 flex items-center gap-1.5 mb-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Bagian yang Sudah Tepat:</span>
                  </div>
                  <ul className="space-y-1.5 text-emerald-800">
                    {evaluation.correctPoints?.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-xs">
                  <div className="font-bold text-amber-900 flex items-center gap-1.5 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span>Kurang Tepat / Belum Dijelaskan:</span>
                  </div>
                  <ul className="space-y-1.5 text-amber-800">
                    {evaluation.missingOrInaccuratePoints?.map((p, idx) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="font-bold">•</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {evaluation.actionableAdvice && (
                <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 text-xs text-indigo-900">
                  <span className="font-bold block mb-1">Saran Perbaikan Konkret:</span>
                  {evaluation.actionableAdvice}
                </div>
              )}
            </div>
          )}

          {/* Full Ideal Solution */}
          {showFullSolution && (
            <div className="bg-gradient-to-br from-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Jawaban Ideal & Pembahasan Lengkap</span>
              </div>

              <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10">
                <span className="text-xs font-bold text-amber-300 block mb-1">
                  Standar Jawaban Ideal:
                </span>
                <p className="text-xs sm:text-sm text-white leading-relaxed">
                  {currentQ.idealAnswer}
                </p>
              </div>

              <div className="text-xs text-indigo-200 leading-relaxed">
                <span className="font-bold text-white block mb-1">Pembahasan Mendalam:</span>
                {currentQ.explanation}
              </div>
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleNextQuestion}
              disabled={currentIndex >= questions.length - 1}
              className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-2 disabled:opacity-40"
            >
              <span>Soal Latihan Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
