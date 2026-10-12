import React, { useState, useEffect, useRef } from 'react';
import {
  Layers,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Loader2,
  Sparkles,
  Clock,
  Filter,
  X,
  Cpu,
} from 'lucide-react';
import { MaterialAnalysis, Flashcard, FlashcardMastery, TimingStats } from '../types';
import { Storage } from '../utils/storage';

interface FlashcardViewProps {
  material: MaterialAnalysis | null;
  onNavigateUpload: () => void;
  preselectedChapter?: string;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  material,
  onNavigateUpload,
  preselectedChapter,
}) => {
  const [selectedChapter, setSelectedChapter] = useState<string>(preselectedChapter || 'all');
  const [cardCount, setCardCount] = useState<number>(10);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [isLoading, setIsLoading] = useState(false);
  const [generationStage, setGenerationStage] = useState<string>('');
  const [generationElapsed, setGenerationElapsed] = useState<number>(0);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [filterMode, setFilterMode] = useState<'all' | 'needs_review'>('all');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [timingStats, setTimingStats] = useState<TimingStats | null>(null);

  const [masteryMap, setMasteryMap] = useState<Record<string, FlashcardMastery>>({});
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (material) {
      const saved = Storage.getFlashcardProgress(material.id) as Record<string, FlashcardMastery>;
      setMasteryMap(saved);
    }
  }, [material]);

  if (!material) {
    return (
      <div className="max-w-xl mx-auto my-12 text-center p-8 bg-white border border-slate-200 rounded-2xl shadow-xs">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
          <Layers className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-slate-800">Materi Kuliah Belum Dipilih</h3>
        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
          Silakan unggah dokumen kuliah terlebih dahulu agar AI dapat merangkum konsep menjadi kartu flashcard pintar.
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

  const handleCancelGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsLoading(false);
    setGenerationStage('');
    setErrorMessage('Pembuatan flashcard dibatalkan.');
  };

  const handleGenerateCards = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    setCurrentIndex(0);
    setIsFlipped(false);
    setGenerationElapsed(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    timerRef.current = setInterval(() => {
      setGenerationElapsed((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    try {
      setGenerationStage('1. Menyiapkan konsep kunci...');
      const chapterObj = material.chapters.find((c) => c.title === selectedChapter);
      const chapterText = chapterObj
        ? `Bab: ${chapterObj.title}. Ringkasan: ${chapterObj.summary}. Konsep: ${chapterObj.keyConcepts.join(', ')}`
        : material.extractedText?.slice(0, 30000) || material.summary;

      setGenerationStage('2. Menghasilkan flashcard dengan Gemini AI...');
      const response = await fetch('/api/generate-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          materialId: material.id,
          materialSummary: material.summary,
          materialText: chapterText,
          chapterTitle: selectedChapter === 'all' ? undefined : selectedChapter,
          count: cardCount,
          model: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal menghasilkan flashcard.');
      }

      setGenerationStage('3. Memvalidasi kartu...');
      const data = await response.json();
      setTimingStats(data.timingStats);
      setFlashcards(data.flashcards || []);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setErrorMessage(err.message || 'Gagal membuat flashcard AI.');
    } finally {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsLoading(false);
      setGenerationStage('');
      abortControllerRef.current = null;
    }
  };

  const handleSetMastery = (cardId: string, status: FlashcardMastery) => {
    setMasteryMap((prev) => {
      const updated = { ...prev, [cardId]: status };
      Storage.saveFlashcardMastery(material.id, cardId, status);
      return updated;
    });

    Storage.addActivity({
      id: 'fc-act-' + Date.now(),
      type: 'flashcard',
      title: `Review Flashcard`,
      materialTitle: material.title,
      date: new Date().toISOString(),
      details: `Status: ${status === 'mastered' ? 'Sudah Paham' : status === 'learning' ? 'Hampir Ingat' : 'Belum Paham'}`,
    });

    if (currentIndex < displayedCards.length - 1) {
      setIsFlipped(false);
      setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
      }, 150);
    }
  };

  const handleShuffle = () => {
    setIsFlipped(false);
    setFlashcards((prev) => [...prev].sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
  };

  const displayedCards = flashcards.filter((card) => {
    if (filterMode === 'needs_review') {
      const status = masteryMap[card.id];
      return status === 'hard' || status === 'learning' || !status;
    }
    return true;
  });

  const currentCard = displayedCards[currentIndex];
  const currentMastery = currentCard ? masteryMap[currentCard.id] || 'unlearned' : 'unlearned';

  const masteredCount = flashcards.filter((c) => masteryMap[c.id] === 'mastered').length;
  const learningCount = flashcards.filter((c) => masteryMap[c.id] === 'learning').length;
  const hardCount = flashcards.filter((c) => masteryMap[c.id] === 'hard').length;

  return (
    <div className="space-y-8 max-w-3xl mx-auto pb-12">
      {/* Config Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">AI Flashcard Interaktif</h2>
              <p className="text-xs text-slate-500">
                Active recall konsep-konsep dari {material.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedChapter}
              onChange={(e) => setSelectedChapter(e.target.value)}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value="all">Semua Bab</option>
              {material.chapters.map((ch, idx) => (
                <option key={ch.id} value={ch.title}>
                  Bab {idx + 1}: {ch.title}
                </option>
              ))}
            </select>

            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="px-2.5 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 bg-slate-50 text-slate-700 focus:outline-hidden"
            >
              <option value={5}>5 Kartu (Cepat)</option>
              <option value={10}>10 Kartu (Standar)</option>
              <option value={15}>15 Kartu</option>
            </select>

            <button
              onClick={handleGenerateCards}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Membuat... ({generationElapsed}s)</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{flashcards.length === 0 ? 'Buat Flashcard' : 'Generate Ulang'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Loading Stepper */}
        {isLoading && (
          <div className="mt-3 p-3 rounded-xl bg-purple-50 border border-purple-200 text-xs flex items-center justify-between animate-in fade-in">
            <div className="flex items-center gap-2 text-purple-950 font-semibold">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-purple-600" />
              <span>{generationStage}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-purple-700">{generationElapsed}s</span>
              <button
                onClick={handleCancelGeneration}
                className="text-rose-600 text-[11px] font-bold px-2 py-0.5 rounded-md hover:bg-rose-50"
              >
                Batal
              </button>
            </div>
          </div>
        )}

        {timingStats && (
          <div className="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-600" />
            <span>Kartu dibuat dalam {(timingStats.totalMs / 1000).toFixed(2)} detik</span>
            {timingStats.isCached && <span>(Cache Hit)</span>}
          </div>
        )}

        {errorMessage && (
          <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
      </div>

      {/* When no cards yet */}
      {flashcards.length === 0 && !isLoading && (
        <div className="bg-white rounded-3xl border border-slate-200 p-10 text-center shadow-xs">
          <Layers className="w-12 h-12 text-purple-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-900">
            Siap Menghafal & Menguasai Materi?
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 leading-relaxed">
            AI akan merangkum definisi, rumus, dan konsep penting dari dokumen kuliah menjadi kartu tanya-jawab ringkas untuk metode Active Recall.
          </p>
          <button
            onClick={handleGenerateCards}
            className="mt-5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md shadow-purple-100 transition-all inline-flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Hasilkan {cardCount} Flashcard Sekarang</span>
          </button>
        </div>
      )}

      {/* Active Card Viewer */}
      {flashcards.length > 0 && currentCard && (
        <div className="space-y-5">
          {/* Progress & Filters */}
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-slate-800">
                Kartu {currentIndex + 1} dari {displayedCards.length}
              </span>
              <div className="hidden sm:flex items-center gap-1.5 text-[11px] font-semibold text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{masteredCount} Paham</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 ml-1"></span>
                <span>{learningCount} Hampir</span>
                <span className="w-2 h-2 rounded-full bg-rose-500 ml-1"></span>
                <span>{hardCount} Belum</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setFilterMode(filterMode === 'all' ? 'needs_review' : 'all');
                  setCurrentIndex(0);
                  setIsFlipped(false);
                }}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all flex items-center gap-1 ${
                  filterMode === 'needs_review'
                    ? 'bg-amber-100 text-amber-900 border-amber-300'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Filter className="w-3 h-3" />
                <span>{filterMode === 'needs_review' ? 'Belum Dikuasai Saja' : 'Semua Kartu'}</span>
              </button>

              <button
                onClick={handleShuffle}
                className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100"
                title="Acak Urutan Kartu"
              >
                <Shuffle className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Flashcard with 3D Flip */}
          <div
            className="perspective-1000 cursor-pointer min-h-[320px] sm:min-h-[360px]"
            onClick={() => setIsFlipped(!isFlipped)}
          >
            <div
              className={`relative w-full h-full min-h-[320px] sm:min-h-[360px] rounded-3xl transition-transform duration-500 transform-style-3d shadow-md hover:shadow-lg ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
            >
              {/* Front Face */}
              <div className="absolute inset-0 w-full h-full bg-white rounded-3xl border border-slate-200 p-8 flex flex-col justify-between backface-hidden">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span>SISI DEPAN: PERTANYAAN / ISTILAH</span>
                  </div>
                  <span className="text-[11px] font-medium text-slate-400">
                    Klik kartu untuk membalik
                  </span>
                </div>

                <div className="my-auto py-6 text-center">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug tracking-tight">
                    {currentCard.front}
                  </h3>
                  {currentCard.chapterRef && (
                    <span className="inline-block mt-3 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                      {currentCard.chapterRef}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-center gap-1.5 text-xs text-slate-400">
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>Tekan kartu atau spasi untuk melihat jawaban</span>
                </div>
              </div>

              {/* Back Face */}
              <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-900 to-purple-900 text-white rounded-3xl border border-indigo-800 p-8 flex flex-col justify-between backface-hidden rotate-y-180">
                <div className="flex items-center justify-between text-xs text-indigo-200">
                  <div className="flex items-center gap-1.5 font-semibold text-indigo-100 bg-white/10 px-2.5 py-1 rounded-lg">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>SISI BELAKANG: JAWABAN / PENJELASAN</span>
                  </div>
                  <span className="text-[11px] font-medium text-indigo-300">
                    Klik untuk membalik kembali
                  </span>
                </div>

                <div className="my-auto py-6 text-center">
                  <p className="text-base sm:text-lg font-medium text-white leading-relaxed max-w-lg mx-auto">
                    {currentCard.back}
                  </p>
                </div>

                <div className="text-center text-[11px] text-indigo-300">
                  Evaluasi tingkat pemahaman Anda di tombol bawah
                </div>
              </div>
            </div>
          </div>

          {/* Mastery Rating Buttons */}
          <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
            <div className="text-center text-xs font-semibold text-slate-500 mb-3">
              Tingkat Penguasaan Konsep Ini:
            </div>
            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleSetMastery(currentCard.id, 'hard')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                  currentMastery === 'hard'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-rose-50/70 border-rose-200 text-rose-700 hover:bg-rose-100'
                }`}
              >
                <span>✕ Belum Paham</span>
                <span className="text-[10px] font-normal opacity-80">Ulangi sering</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetMastery(currentCard.id, 'learning')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                  currentMastery === 'learning'
                    ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                    : 'bg-amber-50/70 border-amber-200 text-amber-800 hover:bg-amber-100'
                }`}
              >
                <span>~ Hampir Ingat</span>
                <span className="text-[10px] font-normal opacity-80">Perlu review</span>
              </button>

              <button
                type="button"
                onClick={() => handleSetMastery(currentCard.id, 'mastered')}
                className={`py-3 px-2 rounded-xl text-xs font-bold transition-all border flex flex-col items-center gap-1 ${
                  currentMastery === 'mastered'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50/70 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                }`}
              >
                <span>✓ Sudah Paham</span>
                <span className="text-[10px] font-normal opacity-80">Konsep terkuasai</span>
              </button>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex((prev) => Math.max(0, prev - 1));
              }}
              disabled={currentIndex === 0}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-white disabled:opacity-40 flex items-center gap-1.5"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Kartu Sebelumnya</span>
            </button>

            <button
              onClick={() => {
                setIsFlipped(false);
                setCurrentIndex((prev) => Math.min(displayedCards.length - 1, prev + 1));
              }}
              disabled={currentIndex === displayedCards.length - 1}
              className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs disabled:opacity-40"
            >
              <span>Kartu Berikutnya</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
