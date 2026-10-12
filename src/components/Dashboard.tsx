import React from 'react';
import {
  Sparkles,
  HelpCircle,
  Layers,
  Edit3,
  Calculator,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Award,
  Upload,
  CheckCircle2,
  AlertCircle,
  FileText,
  Clock,
  Zap,
} from 'lucide-react';
import { MaterialAnalysis, QuizResult } from '../types';
import { Storage } from '../utils/storage';

interface DashboardProps {
  activeMaterial: MaterialAnalysis | null;
  materials: MaterialAnalysis[];
  onNavigateTab: (tab: string, chapterTitle?: string) => void;
  onNavigateUpload: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  activeMaterial,
  materials,
  onNavigateTab,
  onNavigateUpload,
}) => {
  const quizResults = Storage.getQuizResults();
  const activities = Storage.getActivities();
  const flashcardProgress = activeMaterial
    ? Storage.getFlashcardProgress(activeMaterial.id)
    : {};

  const masteredCards = Object.values(flashcardProgress).filter(
    (s) => s === 'mastered'
  ).length;

  const avgQuizScore =
    quizResults.length > 0
      ? Math.round(
          quizResults.reduce((acc, q) => acc + q.score, 0) / quizResults.length
        )
      : 0;

  // Features list
  const features = [
    {
      id: 'quiz',
      title: 'AI Quiz Generator',
      badge: 'Interaktif',
      desc: 'Buat kuis otomatis pilihan ganda, benar/salah, isian singkat, dan esai berdasarkan dokumen.',
      icon: HelpCircle,
      gradient: 'from-blue-600 to-indigo-600',
      bgLight: 'bg-blue-50 text-blue-700',
    },
    {
      id: 'flashcards',
      title: 'AI Flashcard',
      badge: 'Spaced Repetition',
      desc: 'Hafalkan definisi dan konsep penting dengan kartu 3D flip interaktif dan penilaian pemahaman.',
      icon: Layers,
      gradient: 'from-purple-600 to-indigo-600',
      bgLight: 'bg-purple-50 text-purple-700',
    },
    {
      id: 'practice',
      title: 'AI Latihan Mandiri',
      badge: 'Tanpa Bocoran',
      desc: 'Ketik jawaban sendiri, dapatkan evaluasi semantik AI, nilai 0-100, dan petunjuk bertahap.',
      icon: Edit3,
      gradient: 'from-indigo-600 to-teal-600',
      bgLight: 'bg-indigo-50 text-indigo-700',
    },
    {
      id: 'solver',
      title: 'AI Pembahasan Soal',
      badge: 'Step-by-Step',
      desc: 'Ketik soal kuliah dan dapatkan uraian metodis, rumus, penalaran langkah demi langkah.',
      icon: Calculator,
      gradient: 'from-slate-800 to-indigo-900',
      bgLight: 'bg-slate-100 text-slate-800',
    },
  ];

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 text-white p-7 sm:p-9 shadow-xl">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-80 h-80 rounded-full bg-white/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur-md text-indigo-100 mb-3 border border-white/15">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Platform Pembelajaran AI Mahasiswa</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight">
            Selamat Datang di AI StudyMate!
          </h2>
          <p className="text-indigo-100 text-xs sm:text-sm mt-2 leading-relaxed font-normal">
            Ubah bahan ajar kuliah menjadi materi belajar interaktif otomatis. AI membaca dokumen Anda secara utuh, merumuskan kuis, flashcard, dan mengevaluasi pemahaman Anda tanpa halusinasi.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {activeMaterial ? (
              <>
                <button
                  onClick={() => onNavigateTab('summary')}
                  className="px-4 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5"
                >
                  <BookOpen className="w-4 h-4 text-indigo-600" />
                  <span>Pelajari: {activeMaterial.title.slice(0, 24)}...</span>
                </button>
                <button
                  onClick={() => onNavigateTab('quiz')}
                  className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/25 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5"
                >
                  <HelpCircle className="w-4 h-4 text-indigo-200" />
                  <span>Mulai Quiz Cepat</span>
                </button>
                <button
                  onClick={() => onNavigateTab('benchmark')}
                  className="px-3.5 py-2.5 rounded-xl bg-emerald-500/30 hover:bg-emerald-500/40 text-emerald-100 font-semibold text-xs border border-emerald-400/30 transition-all flex items-center gap-1.5"
                >
                  <Zap className="w-4 h-4 text-emerald-300" />
                  <span>Uji Kecepatan ⚡</span>
                </button>
              </>
            ) : (
              <button
                onClick={onNavigateUpload}
                className="px-5 py-2.5 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Unggah Dokumen Kuliah Pertama</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Materi Kuliah</span>
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{materials.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Dokumen tersimpan</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Quiz Dikerjakan</span>
            <Award className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{quizResults.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">
            Rata-rata: <span className="font-bold text-indigo-600">{avgQuizScore}%</span>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Flashcard Dikuasai</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{masteredCards}</div>
          <div className="text-[11px] text-slate-500 mt-1">Status 'Sudah Paham'</div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Aktivitas Belajar</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-slate-900">{activities.length}</div>
          <div className="text-[11px] text-slate-500 mt-1">Sesi terlacak</div>
        </div>
      </div>

      {/* Empat Fitur Utama Pembelajaran */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              Fitur Utama Pembelajaran
            </h3>
            <p className="text-xs text-slate-500">
              Pilih metode belajar yang sesuai dengan gaya belajar Anda saat ini
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {features.map((feat) => {
            const Icon = feat.icon;
            return (
              <div
                key={feat.id}
                onClick={() => onNavigateTab(feat.id)}
                className="group cursor-pointer bg-white rounded-2xl border border-slate-200 p-6 hover:border-indigo-300 hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.gradient} text-white flex items-center justify-center shadow-md shadow-indigo-100 group-hover:scale-105 transition-transform`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                      {feat.badge}
                    </span>
                  </div>

                  <h4 className="text-base font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed mt-1.5">
                    {feat.desc}
                  </p>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-indigo-600 group-hover:text-indigo-700">
                  <span>Mulai Belajar</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Material Snapshot (if available) */}
      {activeMaterial && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-4 border-b border-slate-100">
            <div>
              <span className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
                Materi yang Sedang Dipelajari
              </span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5">
                {activeMaterial.title}
              </h3>
              <p className="text-xs text-slate-500">
                Mata Kuliah: {activeMaterial.subject}
              </p>
            </div>

            <button
              onClick={() => onNavigateTab('summary')}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 w-fit"
            >
              <span>Detail Ringkasan Bab</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed line-clamp-3 mb-4">
            {activeMaterial.summary}
          </p>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block text-sm">
                {activeMaterial.chapters.length}
              </span>
              <span className="text-[11px] text-slate-400">Bab Materi</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block text-sm">
                {activeMaterial.keyTerms.length}
              </span>
              <span className="text-[11px] text-slate-400">Istilah Penting</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block text-sm">
                {activeMaterial.examPointers.length}
              </span>
              <span className="text-[11px] text-slate-400">Poin Ujian</span>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="font-bold text-slate-800 block text-sm">
                {activeMaterial.reviewRecommendations.length}
              </span>
              <span className="text-[11px] text-slate-400">Rekomendasi Review</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
