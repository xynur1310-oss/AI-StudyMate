import React, { useState } from 'react';
import {
  Calculator,
  Sparkles,
  HelpCircle,
  BookOpen,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Copy,
  Check,
  Send,
  Layers,
  ArrowRight,
  Code2,
} from 'lucide-react';
import { MaterialAnalysis, ProblemSolution } from '../types';
import { Storage } from '../utils/storage';

interface ProblemSolverViewProps {
  material: MaterialAnalysis | null;
  initialProblem?: string;
  onNavigateUpload: () => void;
}

export const ProblemSolverView: React.FC<ProblemSolverViewProps> = ({
  material,
  initialProblem = '',
  onNavigateUpload,
}) => {
  const [problemText, setProblemText] = useState(initialProblem);
  const [depth, setDepth] = useState<'singkat' | 'standar' | 'mendalam'>('standar');
  const [selectedChapter, setSelectedChapter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(false);
  const [solution, setSolution] = useState<ProblemSolution | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // Quick preset sample questions based on university materials
  const sampleProblems = [
    'Sebuah graf memiliki 5 simpul A, B, C, D, E dengan bobot sisi A-B=4, A-C=2, B-C=1, B-D=5, C-D=8, C-E=10, D-E=2. Carilah lintasan terpendek dari simpul A ke E menggunakan algoritma Dijkstra beserta tabel relaksasinya!',
    'Jelaskan mengapa algoritma Dijkstra dapat menghasilkan jawaban yang salah jika diterapkan pada graf yang memiliki sisi dengan bobot negatif. Berikan contoh kontradiksinya!',
    'Misalkan fungsi permintaan suatu barang adalah Qd = 100 - 2P dan fungsi penawaran adalah Qs = 20 + 3P. Hitunglah harga dan kuantitas keseimbangan pasar, serta hitung elastisitas permintaan pada titik keseimbangan tersebut!',
    'Suatu sistem memiliki 3 proses P1, P2, P3 dan 4 jenis resource. Jelaskan bagaimana algoritma Banker menentukan apakah status alokasi berada dalam Safe State atau Unsafe State!',
  ];

  const handleSolve = async (customText?: string) => {
    const textToSolve = customText || problemText;
    if (!textToSolve.trim()) {
      setErrorMessage('Silakan masukkan soal atau pertanyaan yang ingin dibahas.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSolution(null);

    try {
      const response = await fetch('/api/solve-problem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problem: textToSolve,
          depth,
          materialContent: material ? material.summary : undefined,
          chapterRef: selectedChapter !== 'all' ? selectedChapter : undefined,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Gagal memproses pembahasan soal.');
      }

      const data: ProblemSolution = await response.json();
      setSolution(data);

      // Save activity
      Storage.addActivity({
        id: 'solve-act-' + Date.now(),
        type: 'solver',
        title: `Pembahasan: ${data.topic || 'Soal Kuliah'}`,
        materialTitle: material ? material.title : 'Problem Solver',
        date: new Date().toISOString(),
        details: `Tingkat ${depth} • ${data.steps.length} Langkah Pembahasan`,
      });
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menganalisis soal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopySolution = () => {
    if (!solution) return;
    const text = `PEMBAHASAN SOAL: ${solution.problem}\n\nTopik: ${solution.topic}\nKonsep: ${solution.conceptsNeeded.join(', ')}\n\nLANGKAH-LANGKAH:\n${solution.steps.map((s) => `${s.stepNumber}. ${s.title}\n${s.explanation}\nAlasan: ${s.reasoning}\n`).join('\n')}\n\nJAWABAN AKHIR:\n${solution.finalAnswer}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-12">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-100">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">AI Pembahasan Soal Terstruktur</h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Uraian langkah demi langkah, identifikasi rumus, alasan metodis, dan referensi materi kuliah
            </p>
          </div>
        </div>

        {errorMessage && (
          <div className="my-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="pt-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ketik atau Tempelkan Soal Anda:
            </label>
            <textarea
              rows={4}
              value={problemText}
              onChange={(e) => setProblemText(e.target.value)}
              placeholder="Contoh: Hitunglah matriks ketetanggaan, nilai elastisitas, probabilitas bersyarat, atau buktikan suatu teorema..."
              className="w-full p-4 text-xs sm:text-sm rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed text-slate-800"
            />
          </div>

          {/* Quick preset chips */}
          <div>
            <span className="text-[11px] font-semibold text-slate-400 block mb-1.5">
              Atau coba contoh soal kuliah nyata:
            </span>
            <div className="flex flex-wrap gap-2">
              {sampleProblems.map((prob, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setProblemText(prob);
                    handleSolve(prob);
                  }}
                  className="text-left text-[11px] font-medium text-indigo-700 bg-indigo-50/70 hover:bg-indigo-100 px-3 py-1.5 rounded-lg border border-indigo-100 transition-colors line-clamp-1 max-w-sm"
                >
                  Contoh {idx + 1}: {prob.slice(0, 50)}...
                </button>
              ))}
            </div>
          </div>

          {/* Options: Depth and Chapter */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Tingkat Kedalaman Penjelasan
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['singkat', 'standar', 'mendalam'] as const).map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDepth(d)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold capitalize transition-all border ${
                      depth === d
                        ? 'bg-indigo-600 text-white border-indigo-600 shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {material && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Kaitkan dengan Bab Materi Kuliah
                </label>
                <select
                  value={selectedChapter}
                  onChange={(e) => setSelectedChapter(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs font-medium rounded-xl border border-slate-200 bg-slate-50 focus:outline-hidden"
                >
                  <option value="all">Kaitkan Seluruh Dokumen</option>
                  {material.chapters.map((ch, idx) => (
                    <option key={ch.id} value={ch.title}>
                      Bab {idx + 1}: {ch.title}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={() => handleSolve()}
              disabled={isLoading || !problemText.trim()}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Menganalisis & Menyusun Langkah...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Dapatkan Pembahasan AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Solution Display */}
      {solution && (
        <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
          {/* Missing Info Warning if Any */}
          {solution.missingInformationWarning && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Informasi Soal Kurang Lengkap: </span>
                <span>{solution.missingInformationWarning}</span>
              </div>
            </div>
          )}

          {/* Solution Header Card */}
          <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl">
            <div className="flex items-center justify-between gap-4 mb-3">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/10 text-indigo-200 border border-white/10">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Topik: {solution.topic}</span>
              </div>

              <button
                onClick={handleCopySolution}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold border border-white/15 transition-colors flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tersalin</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Salin Pembahasan</span>
                  </>
                )}
              </button>
            </div>

            <h3 className="text-base sm:text-lg font-bold text-white leading-relaxed">
              {solution.problem}
            </h3>

            {/* Concepts and Formulas */}
            <div className="mt-6 pt-5 border-t border-white/10 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-indigo-300 font-bold block mb-1">
                  Konsep yang Digunakan:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {solution.conceptsNeeded?.map((c, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-0.5 rounded-md bg-white/10 text-white text-[11px]"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              {solution.formulasNeeded && solution.formulasNeeded.length > 0 && (
                <div>
                  <span className="text-indigo-300 font-bold block mb-1">
                    Rumus / Rumusan yang Dipakai:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {solution.formulasNeeded.map((f, idx) => (
                      <span
                        key={idx}
                        className="px-2.5 py-0.5 rounded-md bg-indigo-500/20 text-indigo-200 text-[11px] font-mono"
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step by Step Breakdown */}
          <div className="space-y-4">
            <h4 className="text-base font-bold text-slate-900 px-1">
              Langkah Demi Langkah Pembahasan
            </h4>

            {solution.steps?.map((step) => (
              <div
                key={step.stepNumber}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs hover:border-indigo-300 transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="w-7 h-7 rounded-xl bg-indigo-600 text-white text-xs font-black flex items-center justify-center shrink-0">
                    {step.stepNumber}
                  </span>
                  <h5 className="font-bold text-sm text-slate-900">{step.title}</h5>
                </div>

                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed mb-3">
                  {step.explanation}
                </p>

                {step.formulaOrCode && (
                  <div className="my-3 p-3.5 rounded-xl bg-slate-900 text-indigo-200 font-mono text-xs overflow-x-auto">
                    <pre className="whitespace-pre-wrap">{step.formulaOrCode}</pre>
                  </div>
                )}

                <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900">
                  <span className="font-bold mr-1">Alasan Mengapa Langkah Ini Digunakan:</span>
                  <span>{step.reasoning}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Final Answer Highlight Box */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-6 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              <span>Kesimpulan / Jawaban Akhir yang Jelas:</span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-950 font-semibold leading-relaxed whitespace-pre-line">
              {solution.finalAnswer}
            </p>
            {solution.chapterReference && (
              <div className="mt-3 text-[11px] font-medium text-emerald-700">
                Dasar Materi: {solution.chapterReference}
              </div>
            )}
          </div>

          {/* Additional Notes / Exam Tips */}
          {solution.additionalNotes && (
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <span className="font-bold text-slate-800 block mb-1">Catatan Tambahan / Tips Ujian:</span>
              <p className="leading-relaxed">{solution.additionalNotes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
