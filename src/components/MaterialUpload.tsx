import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  AlertCircle,
  Loader2,
  Trash2,
  CheckCircle2,
  Sparkles,
  BookOpen,
  ArrowRight,
  Clock,
  Database,
  Cpu,
  Layers,
  HelpCircle,
  X,
  Zap,
} from 'lucide-react';
import { MaterialAnalysis } from '../types';
import { SAMPLE_MATERIALS, SampleMaterial } from '../data/sampleMaterials';

interface MaterialUploadProps {
  onMaterialProcessed: (mat: MaterialAnalysis) => void;
  onNavigateTab: (tab: string) => void;
  materials: MaterialAnalysis[];
  onDeleteMaterial: (id: string) => void;
  onSelectMaterial: (mat: MaterialAnalysis) => void;
  activeMaterial: MaterialAnalysis | null;
}

export const MaterialUpload: React.FC<MaterialUploadProps> = ({
  onMaterialProcessed,
  onNavigateTab,
  materials,
  onDeleteMaterial,
  onSelectMaterial,
  activeMaterial,
}) => {
  const [mode, setMode] = useState<'upload' | 'manual' | 'samples'>('upload');
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [manualTitle, setManualTitle] = useState('');
  const [manualSubject, setManualSubject] = useState('');
  const [manualText, setManualText] = useState('');
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash-lite');
  const [bypassCache, setBypassCache] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [processStep, setProcessStep] = useState<string>('');
  const [currentStageNumber, setCurrentStageNumber] = useState<number>(1);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUploaded, setLastUploaded] = useState<MaterialAnalysis | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const startStopwatch = () => {
    setElapsedSeconds(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setElapsedSeconds((prev) => +(prev + 0.1).toFixed(1));
    }, 100);
  };

  const stopStopwatch = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file: File) => {
    const validExtensions = ['.pdf', '.docx', '.txt', '.pptx'];
    const hasValidExt = validExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidExt) {
      setErrorMessage(
        'Format berkas tidak didukung. Mohon unggah berkas PDF, DOCX, TXT, atau PPTX.'
      );
      setSelectedFile(null);
      return;
    }

    const isTxt = file.name.toLowerCase().endsWith('.txt');
    const maxBinaryBytes = 3.3 * 1024 * 1024; // 3.3 MB binary => ~4.4 MB base64 (within Vercel 4.5MB limit)
    const maxTextBytes = 4.0 * 1024 * 1024; // 4.0 MB plain text

    if (!isTxt && file.size > maxBinaryBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `Ukuran berkas (${sizeMb} MB) melebihi batas fungsi serverless Vercel (maksimal 3.3 MB untuk dokumen PDF/DOCX). Tips: Silakan ekstrak bab atau halaman yang ingin dipelajari, simpan sebagai PDF ringkas, atau salin-tempel langsung di tab 'Teks Manual'.`
      );
      setSelectedFile(null);
      return;
    }

    if (isTxt && file.size > maxTextBytes) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
      setErrorMessage(
        `Ukuran berkas teks (${sizeMb} MB) melebihi batas serverless (maksimal 4 MB). Silakan kurangi ukuran dokumen.`
      );
      setSelectedFile(null);
      return;
    }

    setErrorMessage(null);
    setSelectedFile(file);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleCancelProcess = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    stopStopwatch();
    setIsLoading(false);
    setProcessStep('');
    setErrorMessage('Pemrosesan dibatalkan oleh pengguna.');
  };

  // Submit Uploaded File
  const handleProcessFile = async () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setErrorMessage(null);
    startStopwatch();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setCurrentStageNumber(1);
      setProcessStep('1. Membaca & memvalidasi file...');

      let payload: any = {
        fileName: selectedFile.name,
        fileSize: (selectedFile.size / 1024).toFixed(1) + ' KB',
        bypassCache,
        preferredModel: selectedModel,
      };

      if (selectedFile.name.endsWith('.txt')) {
        const text = await selectedFile.text();
        payload.textContent = text;
        payload.mimeType = 'text/plain';
      } else {
        setCurrentStageNumber(2);
        setProcessStep('2. Mengekstrak materi secara efisien di server...');
        const base64 = await fileToBase64(selectedFile);
        payload.fileBase64 = base64;
        payload.mimeType = selectedFile.type || 'application/pdf';
      }

      setCurrentStageNumber(3);
      setProcessStep('3. Memahami topik & struktur bab dengan Gemini AI...');

      const response = await fetch('/api/analyze-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Terjadi kesalahan saat memproses materi.');
      }

      setCurrentStageNumber(4);
      setProcessStep('4. Selesai! Materi siap dipelajari.');

      const data = await response.json();
      const analysis: MaterialAnalysis = {
        id: 'mat-' + Date.now(),
        title: data.title || selectedFile.name.replace(/\.[^/.]+$/, ''),
        subject: data.subject || 'Materi Akademik',
        fileName: selectedFile.name,
        fileSize: payload.fileSize,
        pageCount: data.pageCount || 1,
        wordCount: data.wordCount || 0,
        createdAt: new Date().toISOString(),
        extractedText: data.extractedText,
        isScannedPdf: data.isScannedPdf,
        modelUsed: data.modelUsed,
        timingStats: data.timingStats,
        summary: data.summary,
        chapters: data.chapters || [],
        keyTerms: data.keyTerms || [],
        examPointers: data.examPointers || [],
        reviewRecommendations: data.reviewRecommendations || [],
      };

      setLastUploaded(analysis);
      onMaterialProcessed(analysis);
      setSelectedFile(null);
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.error(err);
      setErrorMessage(
        err.message || 'File tidak dapat dibaca atau dianalisis. Silakan coba kembali.'
      );
    } finally {
      stopStopwatch();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Submit Manual Text
  const handleProcessManualText = async () => {
    if (!manualText.trim()) {
      setErrorMessage('Isi teks materi kuliah tidak boleh kosong.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    startStopwatch();

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      setCurrentStageNumber(2);
      setProcessStep('2. Mengekstrak materi...');

      setCurrentStageNumber(3);
      setProcessStep('3. Memahami topik dengan Gemini AI...');

      const response = await fetch('/api/analyze-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: manualText,
          fileName: manualTitle || 'Catatan Kuliah Manual',
          bypassCache,
          preferredModel: selectedModel,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memproses teks.');
      }

      setCurrentStageNumber(4);
      setProcessStep('4. Selesai! Materi siap.');

      const data = await response.json();
      const analysis: MaterialAnalysis = {
        id: 'mat-' + Date.now(),
        title: manualTitle.trim() || data.title || 'Materi Kuliah',
        subject: manualSubject.trim() || data.subject || 'Mata Kuliah',
        createdAt: new Date().toISOString(),
        pageCount: data.pageCount || 1,
        wordCount: data.wordCount || manualText.split(/\s+/).length,
        extractedText: manualText,
        modelUsed: data.modelUsed,
        timingStats: data.timingStats,
        summary: data.summary,
        chapters: data.chapters || [],
        keyTerms: data.keyTerms || [],
        examPointers: data.examPointers || [],
        reviewRecommendations: data.reviewRecommendations || [],
      };

      setLastUploaded(analysis);
      onMaterialProcessed(analysis);
      setManualText('');
      setManualTitle('');
      setManualSubject('');
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      setErrorMessage(err.message || 'Gagal memproses teks materi.');
    } finally {
      stopStopwatch();
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  // Load Sample Material
  const handleLoadSample = async (sample: SampleMaterial) => {
    setIsLoading(true);
    setErrorMessage(null);
    startStopwatch();

    try {
      setCurrentStageNumber(3);
      setProcessStep(`3. Menganalisis ${sample.title} dengan AI...`);

      const response = await fetch('/api/analyze-material', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          textContent: sample.content,
          fileName: sample.title,
          preferredModel: selectedModel,
          bypassCache,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Gagal memuat materi contoh.');
      }

      setCurrentStageNumber(4);
      setProcessStep('4. Siap dipelajari!');

      const data = await response.json();
      const analysis: MaterialAnalysis = {
        id: 'mat-' + Date.now(),
        title: sample.title,
        subject: sample.subject,
        createdAt: new Date().toISOString(),
        pageCount: data.pageCount || 3,
        wordCount: data.wordCount || sample.content.split(/\s+/).length,
        extractedText: sample.content,
        modelUsed: data.modelUsed,
        timingStats: data.timingStats,
        summary: data.summary,
        chapters: data.chapters || [],
        keyTerms: data.keyTerms || [],
        examPointers: data.examPointers || [],
        reviewRecommendations: data.reviewRecommendations || [],
      };

      setLastUploaded(analysis);
      onMaterialProcessed(analysis);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menganalisis contoh materi.');
    } finally {
      stopStopwatch();
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Success Notification Banner with Exact Timing Stats */}
      {lastUploaded && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-2xl p-6 shadow-xs animate-in fade-in slide-in-from-top-3 duration-300">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-emerald-200">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Materi Berhasil Dianalisis
                  </span>
                  {lastUploaded.timingStats?.isCached && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-indigo-100 text-indigo-700 flex items-center gap-1">
                      <Database className="w-3 h-3" />
                      <span>Cache Hit (&lt;10ms)</span>
                    </span>
                  )}
                  {lastUploaded.modelUsed && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-700">
                      {lastUploaded.modelUsed}
                    </span>
                  )}
                </div>

                <h3 className="text-lg font-bold text-slate-900">{lastUploaded.title}</h3>
                <p className="text-xs text-slate-600 mt-0.5">
                  Mata Kuliah: <span className="font-semibold">{lastUploaded.subject}</span> • ~{lastUploaded.pageCount} Halaman • {lastUploaded.chapters.length} Bab
                </p>

                {/* Timing breakdown badge */}
                {lastUploaded.timingStats && (
                  <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                    <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-white px-2 py-0.5 rounded-md border border-emerald-200">
                      <Clock className="w-3 h-3 text-emerald-600" />
                      <span>Total: {(lastUploaded.timingStats.totalMs / 1000).toFixed(2)} detik</span>
                    </span>
                    {lastUploaded.timingStats.extractMs !== undefined && (
                      <span className="text-slate-500">
                        Ekstraksi: {lastUploaded.timingStats.extractMs}ms
                      </span>
                    )}
                    {lastUploaded.timingStats.aiMs !== undefined && (
                      <span className="text-slate-500">
                        Analisis AI: {(lastUploaded.timingStats.aiMs / 1000).toFixed(2)}s
                      </span>
                    )}
                    {lastUploaded.timingStats.savingsPercentage ? (
                      <span className="font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                        Hemat data: {lastUploaded.timingStats.savingsPercentage}%
                      </span>
                    ) : null}
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <button
                onClick={() => onNavigateTab('summary')}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 hover:border-slate-300 text-slate-700 rounded-xl transition-all shadow-2xs"
              >
                Lihat Ringkasan
              </button>
              <button
                onClick={() => onNavigateTab('quiz')}
                className="px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5"
              >
                <span>Mulai Quiz AI</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Input Mode Selector & Engine Config */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Unggah Materi Kuliah
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                <Zap className="w-3 h-3 text-emerald-600" />
                <span>Engine Cepat Aktif</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Ekstraksi teks lokal cepat + pemisahan bab otomatis + cache SHA-256
            </p>
          </div>

          <div className="flex items-center p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => {
                setMode('upload');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'upload'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Upload File
            </button>
            <button
              onClick={() => {
                setMode('manual');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'manual'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Teks Manual
            </button>
            <button
              onClick={() => {
                setMode('samples');
                setErrorMessage(null);
              }}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                mode === 'samples'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Contoh Materi
            </button>
          </div>
        </div>

        {/* Engine Performance Tuning Bar */}
        <div className="my-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-600 shrink-0" />
            <span className="font-semibold text-slate-700">Model AI:</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-200 bg-white text-indigo-700 focus:outline-hidden"
            >
              <option value="gemini-3.5-flash-lite">gemini-3.5-flash-lite (Ultra Cepat ~1.1s)</option>
              <option value="gemini-3.8-flash">gemini-3.8-flash (Thinking Low ~2.5s)</option>
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
            <input
              type="checkbox"
              checked={bypassCache}
              onChange={(e) => setBypassCache(e.target.checked)}
              className="rounded-sm text-indigo-600"
            />
            <span>Bypass Cache (Analisis Ulang Tanpa Cache)</span>
          </label>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="my-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-3">
            <AlertCircle className="w-5 h-5 shrink-0 text-rose-500 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold">Perhatian: </span>
              {errorMessage}
            </div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-rose-500 hover:text-rose-700 font-bold"
            >
              ✕
            </button>
          </div>
        )}

        {/* Live Loading Process Stepper with Real Stopwatch */}
        {isLoading && (
          <div className="my-5 p-5 rounded-2xl bg-indigo-50/70 border border-indigo-200 space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
                <span className="font-bold text-xs text-indigo-950">
                  {processStep}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <div className="font-mono text-xs font-bold text-indigo-700 bg-white px-2.5 py-1 rounded-lg border border-indigo-200">
                  Waktu: {elapsedSeconds} detik
                </div>
                <button
                  type="button"
                  onClick={handleCancelProcess}
                  className="px-2.5 py-1 text-xs font-bold text-rose-600 hover:bg-rose-100 rounded-lg border border-rose-200 transition-colors flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  <span>Batal</span>
                </button>
              </div>
            </div>

            {/* Visual 4-Stage Progress Indicators */}
            <div className="grid grid-cols-4 gap-2 pt-1 text-[11px] font-semibold">
              {[
                { stage: 1, label: '1. Membaca Berkas' },
                { stage: 2, label: '2. Ekstraksi Teks' },
                { stage: 3, label: '3. Pemahaman AI' },
                { stage: 4, label: '4. Siap' },
              ].map((s) => {
                const isPassed = currentStageNumber >= s.stage;
                const isCurrent = currentStageNumber === s.stage;
                return (
                  <div
                    key={s.stage}
                    className={`p-2 rounded-lg text-center transition-all ${
                      isCurrent
                        ? 'bg-indigo-600 text-white shadow-xs animate-pulse'
                        : isPassed
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-white/80 text-slate-400'
                    }`}
                  >
                    {s.label}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* MODE 1: FILE UPLOAD */}
        {mode === 'upload' && (
          <div className="pt-4 space-y-6">
            {!selectedFile ? (
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                  dragActive
                    ? 'border-indigo-500 bg-indigo-50/60 scale-[0.99]'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt,.pptx"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4 shadow-xs">
                  <Upload className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-slate-800">
                  Tarik dan lepas berkas kuliah ke sini
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  atau klik untuk memilih berkas dari komputer Anda
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-[11px] font-medium text-slate-400">
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md">PDF</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md">DOCX</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md">TXT</span>
                  <span className="px-2 py-0.5 bg-slate-100 rounded-md">PPTX</span>
                  <span>(Maks. 3.3MB • Mode Serverless)</span>
                </div>
                <p className="mt-2 text-[11px] text-slate-400">
                  Untuk diktat/buku teks tebal, gunakan tab <span className="font-semibold text-indigo-600">Teks Manual</span>
                </p>
              </div>
            ) : (
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                      <FileText className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="font-bold text-sm text-slate-900">{selectedFile.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        Ukuran: {(selectedFile.size / 1024).toFixed(1)} KB • Siap diproses
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      disabled={isLoading}
                      className="p-2 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Hapus file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={handleProcessFile}
                      disabled={isLoading}
                      className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-70"
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Memproses... ({elapsedSeconds}s)</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          <span>Proses dengan AI StudyMate</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODE 2: MANUAL TEXT INPUT */}
        {mode === 'manual' && (
          <div className="pt-4 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Topik / Bab Materi
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Algoritma Pencarian Biner"
                  value={manualTitle}
                  onChange={(e) => setManualTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Mata Kuliah
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Algoritma & Pemrograman"
                  value={manualSubject}
                  onChange={(e) => setManualSubject(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Isi Materi Kuliah (Teks, Catatan, Bab Buku, dll.)
              </label>
              <textarea
                rows={10}
                placeholder="Tempelkan teks catatan kuliah di sini..."
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full p-4 text-xs font-mono rounded-xl border border-slate-200 focus:outline-hidden focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 leading-relaxed text-slate-800"
              />
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleProcessManualText}
                disabled={isLoading || !manualText.trim()}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-2 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menganalisis... ({elapsedSeconds}s)</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Analisis Teks dengan AI</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* MODE 3: SAMPLE MATERIALS */}
        {mode === 'samples' && (
          <div className="pt-4">
            <p className="text-xs text-slate-500 mb-4">
              Coba langsung materi perkuliahan nyata di bawah ini untuk pemrosesan super cepat:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {SAMPLE_MATERIALS.map((sample) => (
                <div
                  key={sample.id}
                  className="border border-slate-200 hover:border-indigo-300 rounded-2xl p-5 bg-slate-50/50 hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-700">
                      {sample.badge}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 mt-2 line-clamp-2">
                      {sample.title}
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5 font-medium">
                      {sample.subject}
                    </p>
                    <p className="text-[11px] text-slate-600 mt-2 leading-relaxed line-clamp-3">
                      {sample.description}
                    </p>
                  </div>

                  <button
                    onClick={() => handleLoadSample(sample)}
                    disabled={isLoading}
                    className="mt-4 w-full py-2 px-3 rounded-xl bg-white border border-indigo-200 hover:bg-indigo-600 hover:text-white text-indigo-600 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 shadow-2xs"
                  >
                    {isLoading ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Gunakan Contoh Ini</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* SAVED MATERIALS */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-base text-slate-900">
              Materi Tersimpan & Cache ({materials.length})
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Akses instan dari cache lokal
          </span>
        </div>

        {materials.length === 0 ? (
          <div className="text-center py-10 px-4 border border-dashed border-slate-200 rounded-xl">
            <BookOpen className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-xs text-slate-500 font-medium">
              Belum ada materi kuliah yang diunggah.
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Silakan unggah dokumen PDF/DOCX atau gunakan materi contoh di atas.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {materials.map((mat) => {
              const isActive = activeMaterial?.id === mat.id;
              return (
                <div
                  key={mat.id}
                  className={`p-4 rounded-xl border transition-all flex items-start justify-between gap-3 ${
                    isActive
                      ? 'border-indigo-400 bg-indigo-50/40 ring-1 ring-indigo-400'
                      : 'border-slate-200 bg-slate-50/50 hover:bg-white hover:border-slate-300'
                  }`}
                >
                  <div
                    onClick={() => onSelectMaterial(mat)}
                    className="flex-1 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 hover:text-indigo-600 truncate">
                        {mat.title}
                      </span>
                      {isActive && (
                        <span className="text-[10px] bg-indigo-600 text-white font-semibold px-2 py-0.5 rounded-full shrink-0">
                          Aktif
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-500 font-medium mt-1">
                      {mat.subject} • {mat.chapters.length} Bab • ~{mat.pageCount || 1} Halaman
                    </div>
                    {mat.timingStats && (
                      <div className="text-[10px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600" />
                        <span>Diproses dalam {(mat.timingStats.totalMs / 1000).toFixed(2)}s</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onSelectMaterial(mat);
                        onNavigateTab('summary');
                      }}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-lg hover:bg-white"
                      title="Buka Ringkasan"
                    >
                      <BookOpen className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDeleteMaterial(mat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white"
                      title="Hapus materi"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
