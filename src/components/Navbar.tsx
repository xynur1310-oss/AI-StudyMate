import React from 'react';
import { Menu, Upload, ChevronDown, Check, BookOpen, Sparkles, PanelLeftOpen, PanelLeftClose } from 'lucide-react';
import { MaterialAnalysis } from '../types';

interface NavbarProps {
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  isStudyActivity: boolean;
  activeMaterial: MaterialAnalysis | null;
  materials: MaterialAnalysis[];
  onSelectMaterial: (mat: MaterialAnalysis) => void;
  onNavigateUpload: () => void;
  currentTab: string;
}

const TAB_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Dashboard Utama', subtitle: 'Ikhtisar kemajuan belajar & rekomendasi topik' },
  materials: { title: 'Materi Kuliah Saya', subtitle: 'Unggah file atau kelola bahan ajar' },
  summary: { title: 'Pemahaman Materi & Bab', subtitle: 'Ringkasan komprehensif, konsep kunci & poin ujian' },
  quiz: { title: 'AI Quiz Generator', subtitle: 'Kuis interaktif berbasis isi dokumen kuliah' },
  flashcards: { title: 'AI Flashcard Interaktif', subtitle: 'Active recall & spaced repetition konsep penting' },
  practice: { title: 'AI Latihan Mandiri', subtitle: 'Jawab dengan ketikan sendiri, dievaluasi AI secara mendalam' },
  solver: { title: 'AI Pembahasan Soal', subtitle: 'Langkah demi langkah, rumus, penalaran & referensi materi' },
  benchmark: { title: 'Uji Performa & Benchmark Nyata', subtitle: 'Pengujian kecepatan ekstraksi PDF, cache, dan Gemini pada 3 skenario dokumen' },
  history: { title: 'Riwayat Belajar & Statistik', subtitle: 'Catatan progres, tren nilai, dan topik perlu diulang' },
};

export const Navbar: React.FC<NavbarProps> = ({
  onToggleSidebar,
  isSidebarOpen,
  isStudyActivity,
  activeMaterial,
  materials,
  onSelectMaterial,
  onNavigateUpload,
  currentTab,
}) => {
  const [dropdownOpen, setDropdownOpen] = React.useState(false);
  const info = TAB_TITLES[currentTab] || { title: 'AI StudyMate', subtitle: 'Asisten Belajar Cerdas' };

  return (
    <header className="sticky top-0 z-30 bg-white/90 backdrop-blur-md border-b border-slate-200 px-4 lg:px-8 py-3.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {/* Universal Sidebar Toggle Button */}
        <button
          onClick={onToggleSidebar}
          className={`p-2 -ml-1 rounded-xl border transition-all flex items-center gap-1.5 text-xs font-bold ${
            isSidebarOpen
              ? 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
              : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 shadow-xs'
          }`}
          aria-label={isSidebarOpen ? 'Sembunyikan Menu Navigasi' : 'Buka Menu Navigasi'}
          title={isSidebarOpen ? 'Sembunyikan Menu' : 'Buka Menu Navigasi'}
        >
          {isSidebarOpen ? (
            <PanelLeftClose className="w-4 h-4 text-slate-600 shrink-0" />
          ) : (
            <PanelLeftOpen className="w-4 h-4 text-indigo-600 shrink-0" />
          )}
          <span className="hidden sm:inline">
            {isSidebarOpen ? 'Tutup Menu' : 'Menu Navigasi'}
          </span>
        </button>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {info.title}
            </h1>
            {isStudyActivity && (
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-50 border border-indigo-200 text-[10px] font-bold text-indigo-700">
                <Sparkles className="w-3 h-3 text-indigo-600" />
                <span>Mode Fokus Belajar</span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 hidden sm:block">
            {info.subtitle}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Material Switcher Dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-all max-w-[200px] sm:max-w-[260px]"
          >
            <BookOpen className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
            <span className="truncate">
              {activeMaterial ? activeMaterial.title : 'Pilih Materi'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto" />
          </button>

          {dropdownOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setDropdownOpen(false)}
              />
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                <div className="px-2 py-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Ganti Materi Aktif
                </div>
                <div className="max-h-60 overflow-y-auto space-y-1 my-1">
                  {materials.length === 0 ? (
                    <div className="px-3 py-4 text-center text-xs text-slate-400">
                      Belum ada materi kuliah tersimpan.
                    </div>
                  ) : (
                    materials.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => {
                          onSelectMaterial(m);
                          setDropdownOpen(false);
                        }}
                        className={`w-full text-left px-2.5 py-2 rounded-lg text-xs flex items-center justify-between transition-colors ${
                          activeMaterial?.id === m.id
                            ? 'bg-indigo-50 text-indigo-900 font-semibold'
                            : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className="truncate mr-2">
                          <div className="truncate">{m.title}</div>
                          <div className="text-[10px] text-slate-400 truncate">{m.subject}</div>
                        </div>
                        {activeMaterial?.id === m.id && (
                          <Check className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
                        )}
                      </button>
                    ))
                  )}
                </div>
                <div className="pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      onNavigateUpload();
                    }}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Unggah Materi Baru</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Upload Button */}
        <button
          onClick={onNavigateUpload}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Tambah Materi</span>
        </button>
      </div>
    </header>
  );
};
