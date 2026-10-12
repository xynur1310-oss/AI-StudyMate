import React, { useState } from 'react';
import {
  BookOpen,
  Sparkles,
  Layers,
  HelpCircle,
  Edit3,
  Award,
  AlertTriangle,
  Bookmark,
  CheckCircle,
  Search,
  Filter,
} from 'lucide-react';
import { MaterialAnalysis } from '../types';

interface MaterialSummaryProps {
  material: MaterialAnalysis | null;
  onNavigateTab: (tab: string, chapterTitle?: string) => void;
  onNavigateUpload: () => void;
}

export const MaterialSummary: React.FC<MaterialSummaryProps> = ({
  material,
  onNavigateTab,
  onNavigateUpload,
}) => {
  const [selectedChapterId, setSelectedChapterId] = useState<string>('all');
  const [termSearch, setTermSearch] = useState('');

  if (!material) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Belum Ada Materi Terpilih</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Silakan unggah dokumen kuliah atau pilih materi contoh terlebih dahulu untuk melihat ringkasan AI.
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

  const filteredChapters =
    selectedChapterId === 'all'
      ? material.chapters
      : material.chapters.filter((c) => c.id === selectedChapterId);

  const selectedChapter = material.chapters.find((c) => c.id === selectedChapterId);

  const filteredTerms = (material.keyTerms || []).filter(
    (t) =>
      t.term.toLowerCase().includes(termSearch.toLowerCase()) ||
      t.definition.toLowerCase().includes(termSearch.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Info */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-md text-indigo-200 mb-3 border border-white/10">
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>AI Pemahaman Materi Kuliah</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            {material.title}
          </h2>
          <p className="text-indigo-200 text-sm mt-1 font-medium">
            Mata Kuliah: {material.subject}
          </p>

          {/* Quick Actions */}
          <div className="mt-6 flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => onNavigateTab('quiz', selectedChapter?.title)}
              className="px-4 py-2 rounded-xl bg-white text-indigo-950 font-bold text-xs shadow-md hover:bg-indigo-50 transition-all flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5 text-indigo-600" />
              <span>Buat Quiz ({selectedChapter ? 'Bab Ini' : 'Semua'})</span>
            </button>
            <button
              onClick={() => onNavigateTab('flashcards', selectedChapter?.title)}
              className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Layers className="w-3.5 h-3.5 text-indigo-300" />
              <span>Buka Flashcard</span>
            </button>
            <button
              onClick={() => onNavigateTab('practice', selectedChapter?.title)}
              className="px-4 py-2 rounded-xl bg-white/15 backdrop-blur-md hover:bg-white/20 text-white font-semibold text-xs border border-white/20 transition-all flex items-center gap-1.5"
            >
              <Edit3 className="w-3.5 h-3.5 text-indigo-300" />
              <span>Latihan Mandiri (Ketik Sendiri)</span>
            </button>
          </div>
        </div>
      </div>

      {/* Ringkasan Eksekutif */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <Bookmark className="w-5 h-5 text-indigo-600" />
          <h3 className="text-base font-bold text-slate-900">Ringkasan Materi Eksekutif</h3>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed whitespace-pre-line">
          {material.summary}
        </p>
      </div>

      {/* Filter Bab / Topik Tertentu */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Eksplorasi Bab & Topik Materi ({material.chapters.length} Bab)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Pilih bab tertentu untuk memusatkan latihan atau pelajari seluruh konsep.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedChapterId}
              onChange={(e) => setSelectedChapterId(e.target.value)}
              className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            >
              <option value="all">Semua Bab ({material.chapters.length})</option>
              {material.chapters.map((ch, idx) => (
                <option key={ch.id} value={ch.id}>
                  Bab {idx + 1}: {ch.title}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Chapters Cards */}
        <div className="space-y-4">
          {filteredChapters.map((ch, idx) => (
            <div
              key={ch.id}
              className="border border-slate-200 rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:border-indigo-300 transition-all shadow-2xs"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <span className="w-6 h-6 rounded-lg bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <span>{ch.title}</span>
                </h4>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigateTab('quiz', ch.title)}
                    className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Quiz Bab Ini
                  </button>
                  <button
                    onClick={() => onNavigateTab('practice', ch.title)}
                    className="text-[11px] font-semibold text-purple-600 hover:text-purple-800 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    Latihan Bab Ini
                  </button>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                {ch.summary}
              </p>

              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Konsep Inti yang Harus Dipahami:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {ch.keyConcepts.map((concept, cIdx) => (
                    <span
                      key={cIdx}
                      className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-700 text-xs font-medium"
                    >
                      {concept}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Grid: Poin Ujian & Rekomendasi Review */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Poin Berpotensi Bahan Ujian */}
        <div className="bg-white rounded-2xl border border-amber-200/80 p-6 shadow-xs bg-gradient-to-br from-amber-50/30 to-white">
          <div className="flex items-center gap-2 mb-3 text-amber-800">
            <Award className="w-5 h-5 text-amber-600" />
            <h3 className="text-sm font-bold">Poin Berpotensi Keluar Ujian</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            AI mendeteksi konsep berikut memiliki bobot akademik tinggi yang sering dijadikan soal ujian oleh dosen:
          </p>

          <ul className="space-y-2.5">
            {material.examPointers?.map((point, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                <span className="w-4 h-4 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  ✓
                </span>
                <span className="leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Rekomendasi Bagian Perlu Dipelajari Ulang */}
        <div className="bg-white rounded-2xl border border-rose-200/80 p-6 shadow-xs bg-gradient-to-br from-rose-50/30 to-white">
          <div className="flex items-center gap-2 mb-3 text-rose-800">
            <AlertTriangle className="w-5 h-5 text-rose-600" />
            <h3 className="text-sm font-bold">Rekomendasi Bagian Perlu Diulang</h3>
          </div>
          <p className="text-xs text-slate-500 mb-4">
            Bagian materi yang relatif kompleks, abstrak, atau rawan kesalahpahaman:
          </p>

          <ul className="space-y-2.5">
            {material.reviewRecommendations?.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                <span className="w-4 h-4 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                  !
                </span>
                <span className="leading-relaxed">{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Glosarium Istilah & Definisi */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Glosarium Istilah & Definisi ({material.keyTerms.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Definisi teknis yang diambil langsung dari dokumen materi kuliah.
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari istilah atau kata kunci..."
              value={termSearch}
              onChange={(e) => setTermSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          {filteredTerms.length === 0 ? (
            <div className="col-span-2 text-center py-8 text-xs text-slate-400">
              Tidak ada istilah yang cocok dengan pencarian "{termSearch}".
            </div>
          ) : (
            filteredTerms.map((term, idx) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/70 hover:bg-white hover:border-slate-200 transition-all"
              >
                <div className="font-bold text-xs text-indigo-700 flex items-center gap-1.5">
                  <Bookmark className="w-3.5 h-3.5" />
                  <span>{term.term}</span>
                </div>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  {term.definition}
                </p>
                {term.context && (
                  <p className="text-[11px] text-slate-400 mt-1 italic">
                    Konteks: {term.context}
                  </p>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
