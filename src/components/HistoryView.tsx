import React, { useState, useEffect } from 'react';
import {
  History,
  Award,
  HelpCircle,
  Layers,
  Edit3,
  Calculator,
  Calendar,
  AlertCircle,
  Trash2,
  TrendingUp,
  BookOpen,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { Storage } from '../utils/storage';
import { QuizResult, StudyActivity, MaterialAnalysis } from '../types';

interface HistoryViewProps {
  onNavigateTab: (tab: string, chapterTitle?: string) => void;
  materials: MaterialAnalysis[];
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  onNavigateTab,
  materials,
}) => {
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const [activities, setActivities] = useState<StudyActivity[]>([]);

  useEffect(() => {
    setQuizResults(Storage.getQuizResults());
    setActivities(Storage.getActivities());
  }, []);

  const totalQuizzes = quizResults.length;
  const avgScore =
    totalQuizzes > 0
      ? Math.round(
          quizResults.reduce((acc, curr) => acc + curr.score, 0) / totalQuizzes
        )
      : 0;

  // Aggregate weak topics from quizzes
  const allWeakTopics = Array.from(
    new Set(quizResults.flatMap((r) => r.weakTopics || []))
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Info */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
              <History className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Riwayat & Perkembangan Belajar
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Evaluasi progres, riwayat nilai quiz, dan topik yang memerlukan pengulangan
              </p>
            </div>
          </div>

          <div className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
            Penyimpanan: LocalStorage Browser
          </div>
        </div>

        {/* Stats Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6">
          <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-100">
            <div className="text-xs font-semibold text-indigo-700">Materi Terdaftar</div>
            <div className="text-2xl font-black text-indigo-950 mt-1">
              {materials.length}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100">
            <div className="text-xs font-semibold text-blue-700">Quiz Diselesaikan</div>
            <div className="text-2xl font-black text-blue-950 mt-1">
              {totalQuizzes}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <div className="text-xs font-semibold text-emerald-700">Rata-rata Nilai</div>
            <div className="text-2xl font-black text-emerald-950 mt-1">
              {avgScore}%
            </div>
          </div>

          <div className="p-4 rounded-xl bg-purple-50/60 border border-purple-100">
            <div className="text-xs font-semibold text-purple-700">Total Sesi Belajar</div>
            <div className="text-2xl font-black text-purple-950 mt-1">
              {activities.length}
            </div>
          </div>
        </div>
      </div>

      {/* Rekomendasi Topik Perlu Diulang */}
      {allWeakTopics.length > 0 && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-6 shadow-xs">
          <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span>Rekomendasi Topik yang Perlu Diulang (Berdasarkan Hasil Quiz):</span>
          </div>
          <p className="text-xs text-amber-800 mb-3">
            Topik-topik berikut adalah bagian di mana Anda beberapa kali memberikan jawaban kurang tepat:
          </p>
          <div className="flex flex-wrap gap-2">
            {allWeakTopics.map((topic, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-xl bg-white border border-amber-300 text-xs font-semibold text-amber-900 shadow-2xs"
              >
                {topic}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Riwayat Quiz Terakhir */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-indigo-600" />
            <h3 className="text-base font-bold text-slate-900">
              Riwayat Pengerjaan Quiz ({quizResults.length})
            </h3>
          </div>
        </div>

        {quizResults.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada quiz yang dikerjakan. Kerjakan quiz di menu "AI Quiz Generator" untuk melihat skor Anda di sini.
          </div>
        ) : (
          <div className="space-y-3">
            {quizResults.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white transition-colors"
              >
                <div>
                  <div className="font-bold text-sm text-slate-900">{q.materialTitle}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    Topik: {q.chapterTitle} • {q.correctCount}/{q.totalQuestions} Benar •{' '}
                    {new Date(q.completedAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div
                    className={`px-3 py-1 rounded-xl font-bold text-sm ${
                      q.score >= 80
                        ? 'bg-emerald-100 text-emerald-800'
                        : q.score >= 60
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {q.score}%
                  </div>
                  <button
                    onClick={() => onNavigateTab('quiz')}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg text-xs font-semibold"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Log Aktivitas Belajar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">
            Log Aktivitas Belajar Terbaru ({activities.length})
          </h3>
        </div>

        {activities.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400 border border-dashed border-slate-200 rounded-xl">
            Belum ada aktivitas belajar yang tercatat.
          </div>
        ) : (
          <div className="space-y-2.5">
            {activities.slice(0, 15).map((act) => (
              <div
                key={act.id}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs ${
                      act.type === 'quiz'
                        ? 'bg-blue-100 text-blue-700'
                        : act.type === 'flashcard'
                        ? 'bg-purple-100 text-purple-700'
                        : act.type === 'practice'
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {act.type === 'quiz' ? (
                      <HelpCircle className="w-3.5 h-3.5" />
                    ) : act.type === 'flashcard' ? (
                      <Layers className="w-3.5 h-3.5" />
                    ) : act.type === 'practice' ? (
                      <Edit3 className="w-3.5 h-3.5" />
                    ) : (
                      <Calculator className="w-3.5 h-3.5" />
                    )}
                  </span>
                  <div>
                    <span className="font-bold text-slate-800">{act.title}</span>
                    <span className="text-slate-400 mx-1.5">•</span>
                    <span className="text-slate-500">{act.details}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  {new Date(act.date).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
