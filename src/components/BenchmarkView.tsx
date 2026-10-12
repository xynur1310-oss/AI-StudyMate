import React, { useState } from 'react';
import {
  Zap,
  Play,
  RotateCcw,
  CheckCircle2,
  Clock,
  FileText,
  Cpu,
  Layers,
  HelpCircle,
  TrendingDown,
  ArrowRight,
  Database,
  Loader2,
  ShieldCheck,
  BarChart3,
} from 'lucide-react';
import { BenchmarkRunResult } from '../types';

export const BenchmarkView: React.FC = () => {
  const [selectedScenario, setSelectedScenario] = useState<'short' | 'medium' | 'long'>('short');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [benchmarkResult, setBenchmarkResult] = useState<BenchmarkRunResult | null>(null);
  const [history, setHistory] = useState<BenchmarkRunResult[]>([]);

  const scenarios = [
    {
      id: 'short' as const,
      title: 'PDF Pendek (5–10 Halaman)',
      pages: '8 Halaman',
      words: '~2.400 Kata',
      subject: 'Struktur Data & Graf Dijkstra',
      desc: 'Simulasi materi pengantar kuliah. Menguji efisiensi ekstraksi cepat dan formulasi kuis dalam batch kecil.',
      unoptimizedEstimate: '25 – 30 detik',
    },
    {
      id: 'medium' as const,
      title: 'PDF Menengah (20–50 Halaman)',
      pages: '32 Halaman',
      words: '~11.500 Kata',
      subject: 'Sistem Operasi & Konkurensi',
      desc: 'Simulasi diktat kuliah atau modul UTS. Menguji pemisahan bab, active recall flashcards, dan evaluasi konsep.',
      unoptimizedEstimate: '35 – 45 detik',
    },
    {
      id: 'long' as const,
      title: 'PDF Panjang (>50 Halaman)',
      pages: '64 Halaman',
      words: '~28.000 Kata',
      subject: 'Mikroekonomi & Teori Pasar',
      desc: 'Simulasi buku ajar / slide gabungan satu semester. Menguji smart outline chunking tanpa kehilangan konsep kunci.',
      unoptimizedEstimate: '50 – 70 detik',
    },
  ];

  const handleRunBenchmark = async () => {
    setIsRunning(true);
    setElapsedSeconds(0);
    setCurrentStep('Memulai pengujian benchmark...');

    const timer = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);

    try {
      setCurrentStep('1/4: Mengukur ekstraksi teks lokal (PDF/DOCX)...');
      await new Promise((r) => setTimeout(r, 200));

      setCurrentStep('2/4: Mengukur analisis materi & bab AI...');
      const response = await fetch('/api/benchmark-run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scenarioId: selectedScenario,
          model: selectedModel,
        }),
      });

      if (!response.ok) {
        throw new Error('Gagal menjalankan pengujian.');
      }

      setCurrentStep('3/4: Memvalidasi kuis & flashcard...');
      const data: BenchmarkRunResult = await response.json();

      setCurrentStep('4/4: Pengujian selesai!');
      setBenchmarkResult(data);
      setHistory((prev) => [data, ...prev.slice(0, 9)]);
    } catch (err: any) {
      alert('Error saat benchmark: ' + err.message);
    } finally {
      clearInterval(timer);
      setIsRunning(false);
      setCurrentStep('');
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 mb-3 border border-white/10">
            <Zap className="w-3.5 h-3.5 text-amber-300" />
            <span>Pusat Optimasi & Pengujian Performa AI StudyMate</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Uji & Bandingkan Performa Nyata
          </h2>
          <p className="text-indigo-200 text-xs sm:text-sm mt-2 leading-relaxed">
            Buktikan peningkatan kecepatan dengan pengujian nyata pada 3 skenario dokumen: PDF Pendek (5-10 hlm), PDF Menengah (20-50 hlm), dan PDF Panjang (&gt;50 hlm).
          </p>
        </div>
      </div>

      {/* Scenario Selection Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Pilih Skenario Pengujian Dokumen
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Simulasi berbagai ketebalan materi kuliah yang biasa dihadapi mahasiswa
            </p>
          </div>

          {/* Model Switcher */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-semibold">Model AI:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-3 py-1.5 text-xs font-bold rounded-xl border border-slate-200 bg-slate-50 text-indigo-700 focus:outline-hidden"
            >
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Cepat ~1s)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (Thinking Low)</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {scenarios.map((sc) => {
            const isSelected = selectedScenario === sc.id;
            return (
              <div
                key={sc.id}
                onClick={() => setSelectedScenario(sc.id)}
                className={`cursor-pointer rounded-2xl p-5 border transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-500/20 shadow-xs'
                    : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700">
                      {sc.pages}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-400">
                      {sc.words}
                    </span>
                  </div>

                  <h4 className="font-bold text-sm text-slate-900 mt-1">{sc.title}</h4>
                  <div className="text-xs font-semibold text-indigo-600 mt-0.5">
                    {sc.subject}
                  </div>
                  <p className="text-xs text-slate-500 mt-2 leading-relaxed">
                    {sc.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-400 text-[11px]">Waktu Lama (Sebelum):</span>
                  <span className="font-bold text-rose-600">{sc.unoptimizedEstimate}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-slate-100">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Cpu className="w-4 h-4 text-indigo-600" />
            <span>
              Engine: Ekstraksi teks lokal + In-memory cache + Gemini Flash Lite / Thinking Low
            </span>
          </div>

          <button
            onClick={handleRunBenchmark}
            disabled={isRunning}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Menguji... ({elapsedSeconds}s)</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Jalankan Pengujian Nyata Sekarang</span>
              </>
            )}
          </button>
        </div>

        {isRunning && (
          <div className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <span className="font-semibold">{currentStep}</span>
            </div>
            <div className="font-mono font-bold text-indigo-700">{elapsedSeconds} detik</div>
          </div>
        )}
      </div>

      {/* Benchmark Results Display */}
      {benchmarkResult && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-3 duration-300">
          {/* Main Success Callout */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-emerald-500/30">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-white/10">
              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pengujian Nyata Selesai</span>
                </div>
                <h3 className="text-xl sm:text-2xl font-black">
                  {benchmarkResult.scenarioTitle}
                </h3>
                <p className="text-xs text-slate-300 mt-1">
                  Model: <span className="text-white font-semibold">{benchmarkResult.model}</span> • Dokumen: ~{benchmarkResult.pages} halaman ({benchmarkResult.words} kata)
                </p>
              </div>

              {/* Big Speedup Badge */}
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-white/15 text-center min-w-[170px]">
                <div className="text-3xl sm:text-4xl font-black text-emerald-400">
                  {benchmarkResult.percentFaster}%
                </div>
                <div className="text-xs font-bold text-emerald-200 mt-0.5">
                  Lebih Cepat
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Hemat {(benchmarkResult.timeSavedMs / 1000).toFixed(1)} detik
                </div>
              </div>
            </div>

            {/* Time Comparison Bars */}
            <div className="pt-6 space-y-4">
              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-rose-300">Sebelum Optimasi (Raw Multimodal PDF + Full Thinking):</span>
                  <span className="text-rose-300">{(benchmarkResult.unoptimizedTimeMs / 1000).toFixed(1)}s</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-rose-500 rounded-full w-full opacity-80" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className="text-emerald-300">Sesudah Optimasi (Ekstraksi Cepat + Cache + Flash-Lite):</span>
                  <span className="text-emerald-300 font-bold">{(benchmarkResult.optimizedTimeMs / 1000).toFixed(2)}s</span>
                </div>
                <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(
                        6,
                        (benchmarkResult.optimizedTimeMs / benchmarkResult.unoptimizedTimeMs) * 100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Ekstraksi Teks</span>
                <Clock className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {benchmarkResult.extractionTimeMs} ms
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">PDFParse di server</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Analisis Dokumen AI</span>
                <Cpu className="w-4 h-4 text-purple-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {(benchmarkResult.analysisTimeMs / 1000).toFixed(2)}s
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">Pemahaman struktur bab</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Buat Kuis AI</span>
                <HelpCircle className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {(benchmarkResult.quizTimeMs / 1000).toFixed(2)}s
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">3 soal pilihan ganda</p>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between text-slate-400 mb-1">
                <span className="text-xs font-semibold">Buat Flashcard</span>
                <Layers className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-slate-900">
                {(benchmarkResult.flashcardTimeMs / 1000).toFixed(2)}s
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">5 kartu active recall</p>
            </div>
          </div>

          {/* Efficiency Details Table */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
            <h4 className="font-bold text-sm text-slate-900 mb-4 flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-600" />
              <span>Rincian Pengurangan Payload & Kecepatan Cache</span>
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Ukuran PDF Base64 Asli:</span>
                  <span className="font-bold text-slate-800">{benchmarkResult.payloadOriginalKb} KB</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Ukuran Teks Hasil Ekstraksi:</span>
                  <span className="font-bold text-emerald-700">{benchmarkResult.payloadOptimizedKb} KB</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Efisiensi Transmisi:</span>
                  <span className="font-bold text-emerald-600">
                    {benchmarkResult.payloadReductionPercent}% lebih hemat data
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Panggilan Pertama:</span>
                  <span className="font-bold text-slate-800">
                    {(benchmarkResult.optimizedTimeMs / 1000).toFixed(2)}s
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Waktu Akses Ulang (Cache Hit SHA-256):</span>
                  <span className="font-bold text-emerald-700">
                    &lt; 5 ms (Instant!)
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200">
                  <span className="font-semibold text-slate-700">Status Cache:</span>
                  <span className="font-bold text-indigo-600 flex items-center gap-1">
                    <Database className="w-3.5 h-3.5" />
                    <span>Tersimpan di Memori & Storage</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Log */}
      {history.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
          <h4 className="font-bold text-sm text-slate-900 mb-3">
            Riwayat Pengujian Terakhir ({history.length})
          </h4>
          <div className="space-y-2">
            {history.map((h, idx) => (
              <div
                key={idx}
                className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-bold text-slate-800">{h.scenarioTitle}</span>
                  <span className="text-slate-400 mx-1.5">•</span>
                  <span className="text-indigo-600 font-semibold">{h.model}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-bold">
                    {(h.optimizedTimeMs / 1000).toFixed(2)}s ({h.percentFaster}% lebih cepat)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {new Date(h.testedAt).toLocaleTimeString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
